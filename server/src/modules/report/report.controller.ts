import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SystemRole } from '@prisma/client';
import type { Response } from 'express';
import { Roles } from 'src/shared/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { FinancialReportQueryDto } from './dto/financial-report-query.dto';
import { ReportService } from './report.service';

@ApiBearerAuth('access-token')
@ApiTags('Reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(SystemRole.ADMIN)
@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @ApiOperation({
    summary: 'Get financial report for period (admin only, JSON)',
  })
  @Get('financial')
  async getFinancialReport(@Query() query: FinancialReportQueryDto) {
    return this.reportService.getFinancialReport(query);
  }

  @ApiOperation({
    summary: 'Download financial report CSV (admin only)',
  })
  @Get('financial/csv')
  async downloadFinancialReportCsv(
    @Query() query: FinancialReportQueryDto,
    @Res() res: Response,
  ) {
    const report = await this.reportService.getFinancialReport(query);

    const delimiter = ';';
    const escape = (value: unknown) =>
      `"${String(value ?? '').replace(/"/g, '""')}"`;

    const lines: string[][] = [];
    lines.push(['Финансовый отчет']);
    lines.push([]);
    lines.push(['Параметр', 'Значение']);
    lines.push(['Начало периода', report.period.from]);
    lines.push(['Окончание периода', report.period.to]);
    lines.push(['Выручка', String(report.revenue)]);
    lines.push(['Завершенные заказы', String(report.completedOrders)]);
    lines.push(['Новые заявки', String(report.incomingRequests)]);

    lines.push([]);
    lines.push(['Услуги']);
    lines.push([
      'Название',
      'Описание',
      'Базовая цена',
      'Длительность, мин',
      'Активна',
      'Количество',
      'Цена за ед.',
      'Сумма',
    ]);
    for (const item of report.services) {
      lines.push([
        item.name,
        item.service?.description ?? '',
        item.service?.basePrice !== undefined
          ? String(item.service.basePrice)
          : '',
        item.service?.durationMin !== undefined
          ? String(item.service.durationMin)
          : '',
        item.service?.isActive ? 'Да' : 'Нет',
        String(item.quantity),
        String(item.unitPrice),
        String(item.total),
      ]);
    }

    lines.push([]);
    lines.push(['Запчасти']);
    lines.push([
      'Название',
      'Артикул',
      'Ед. изм.',
      'Цена',
      'Активна',
      'Остаток',
      'Количество',
      'Цена за ед.',
      'Сумма',
    ]);
    for (const item of report.parts) {
      lines.push([
        item.name,
        item.part?.article ?? '',
        item.part?.unit ?? '',
        item.part?.price !== undefined ? String(item.part.price) : '',
        item.part?.isActive ? 'Да' : 'Нет',
        item.part?.stockQuantity !== undefined
          ? String(item.part.stockQuantity)
          : '',
        String(item.quantity),
        String(item.unitPrice),
        String(item.total),
      ]);
    }

    lines.push([]);
    lines.push(['Заказ-наряды']);
    lines.push([
      'Номер',
      'Клиент',
      'Телефон',
      'Авто',
      'Статус',
      'Плановая дата',
      'Дата завершения',
      'Работ (шт.)',
      'Запчастей (шт.)',
      'Сумма работ',
      'Сумма запчастей',
      'Итого',
      'ID заявки',
      'Статус заявки',
      'Желаемая дата',
      'Создана заявка',
    ]);
    for (const order of report.workOrdersDetailed ?? []) {
      const vehicle = [
        order.vehicle.make,
        order.vehicle.model,
        order.vehicle.year ?? '',
        order.vehicle.licensePlate,
      ]
        .filter(Boolean)
        .join(' ');
      lines.push([
        order.number,
        order.client.name,
        order.client.phone,
        vehicle,
        order.status,
        order.plannedDate ?? '-',
        order.completedDate ?? '-',
        String(order.servicesCount ?? 0),
        String(order.partsCount ?? 0),
        String(order.servicesTotal ?? 0),
        String(order.partsTotal ?? 0),
        String(order.totalCost ?? 0),
        order.request?.id ?? '-',
        order.request?.status ?? '-',
        order.request?.desiredDate ?? '-',
        order.request?.createdAt ?? '-',
      ]);
    }

    lines.push([]);
    lines.push(['Заявки']);
    lines.push([
      'ID заявки',
      'Клиент',
      'Телефон',
      'Авто',
      'Статус',
      'Желаемая дата',
      'Создана',
      'Комментарий',
    ]);
    for (const request of report.serviceRequestsDetailed ?? []) {
      const vehicle = [
        request.vehicle.make,
        request.vehicle.model,
        request.vehicle.year ?? '',
        request.vehicle.licensePlate,
      ]
        .filter(Boolean)
        .join(' ');
      lines.push([
        request.id,
        request.client.name,
        request.client.phone,
        vehicle,
        request.status,
        request.desiredDate ?? '-',
        request.createdAt ?? '-',
        request.comment ?? '',
      ]);
    }

    const csvRows = lines.map((row) =>
      row.map((cell) => escape(cell)).join(delimiter),
    );
    const csvBody = csvRows.join('\r\n');
    const csvBuffer = Buffer.from(`\uFEFF${csvBody}`, 'utf8');

    const filename = `financial-report-${report.period.from}-${report.period.to}`
      .replace(/[:\s]/g, '-')
      .replace(/[^\w.-]/g, '_');

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}.csv"`,
    );
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.end(csvBuffer);
  }
}
