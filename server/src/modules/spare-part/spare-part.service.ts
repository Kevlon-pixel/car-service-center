import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, SparePart } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { CreateSparePartDto } from './dto/create-spare-part.dto';
import { UpdateSparePartDto } from './dto/update-spare-part.dto';

@Injectable()
export class SparePartService {
  constructor(private readonly prisma: PrismaService) {}

  async getSpareParts(
    search?: string,
    includeInactive = false,
  ): Promise<SparePart[]> {
    try {
      const where: Prisma.SparePartWhereInput = includeInactive
        ? {}
        : { isActive: true };

      const searchTerm = search?.trim();
      if (searchTerm) {
        where.OR = [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { article: { contains: searchTerm, mode: 'insensitive' } },
        ];
      }

      return await this.prisma.sparePart.findMany({
        where,
        orderBy: { name: 'asc' },
      });
    } catch (err) {
      throw new InternalServerErrorException('Failed to fetch spare parts');
    }
  }

  async createSparePart(dto: CreateSparePartDto): Promise<SparePart> {
    try {
      return await this.prisma.sparePart.create({
        data: {
          name: dto.name,
          article: dto.article,
          unit: dto.unit ?? 'pcs',
          price: new Prisma.Decimal(dto.price),
          stockQuantity: dto.stockQuantity ?? 0,
          isActive: dto.isActive ?? true,
        },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException(
          'Spare part with this article already exists',
        );
      }
      throw new InternalServerErrorException('Failed to create spare part');
    }
  }

  async updateSparePart(
    id: string,
    dto: UpdateSparePartDto,
  ): Promise<SparePart> {
    const sparePart = await this.prisma.sparePart.findUnique({ where: { id } });

    if (!sparePart) {
      throw new NotFoundException('Spare part not found');
    }

    const data: Prisma.SparePartUpdateInput = {};

    if (dto.name !== undefined) {
      data.name = dto.name;
    }
    if (dto.article !== undefined) {
      data.article = dto.article;
    }
    if (dto.unit !== undefined) {
      data.unit = dto.unit;
    }
    if (dto.price !== undefined) {
      data.price = new Prisma.Decimal(dto.price);
    }
    if (dto.stockQuantity !== undefined) {
      data.stockQuantity = dto.stockQuantity;
    }
    if (dto.isActive !== undefined) {
      data.isActive = dto.isActive;
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('No fields provided for update');
    }

    try {
      return await this.prisma.sparePart.update({
        where: { id },
        data,
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException(
          'Spare part with this article already exists',
        );
      }
      throw new InternalServerErrorException('Failed to update spare part');
    }
  }

  async deleteSparePart(id: string): Promise<void> {
    const sparePart = await this.prisma.sparePart.findUnique({ where: { id } });

    if (!sparePart) {
      throw new NotFoundException('Spare part not found');
    }

    try {
      await this.prisma.sparePart.delete({ where: { id } });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2003'
      ) {
        throw new BadRequestException(
          'Cannot delete spare part that is used in work orders',
        );
      }
      throw new InternalServerErrorException('Failed to delete spare part');
    }
  }
}
