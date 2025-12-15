"use client";

import { useState } from "react";

import {
  FinancialReport,
  FinancialReportServiceItem,
  FinancialReportPartItem,
  fetchFinancialReport,
  fetchFinancialReportCsv,
} from "@features/report/api/reportApi";
import { Button, TextInput } from "@shared/ui";
import styles from "../../dashboard/dashboard.module.scss";

function toIsoFromLocalInput(value: string) {
  if (!value) return "";
  return new Date(`${value}Z`).toISOString();
}

export function ReportsSection() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [report, setReport] = useState<FinancialReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatMoney = (value: number) =>
    value.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const data = await fetchFinancialReport({
        fromDate: toIsoFromLocalInput(from),
        toDate: toIsoFromLocalInput(to),
      });
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось загрузить отчет");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCsv = async () => {
    setDownloading(true);
    setError(null);
    try {
      const csv = await fetchFinancialReportCsv({
        fromDate: toIsoFromLocalInput(from),
        toDate: toIsoFromLocalInput(to),
      });
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const safeFrom = from ? from.replace(/[:\s]/g, "-") : "from";
      const safeTo = to ? to.replace(/[:\s]/g, "-") : "to";
      link.href = url;
      link.download = `financial-report-${safeFrom}-${safeTo}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось скачать CSV");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.sectionHeading}>
        <div>
          <p className={styles.muted}>Отчеты по сервису</p>
          <h3 style={{ margin: "4px 0 0" }}>Финансы</h3>
        </div>
      </div>

      <form className={styles.formGrid} onSubmit={handleSubmit}>
        <TextInput
          label="Начало периода"
          type="datetime-local"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          required
        />
        <TextInput
          label="Окончание периода"
          type="datetime-local"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          required
        />
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
          <Button type="submit" size="sm" disabled={loading}>
            {loading ? "Загрузка..." : "Показать отчет"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleDownloadCsv}
            disabled={loading || downloading}
          >
            {downloading ? "Подготовка..." : "Скачать CSV"}
          </Button>
          {report && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setReport(null)}
              disabled={loading}
            >
              Очистить
            </Button>
          )}
        </div>
      </form>

      {error && (
        <div className={styles.alert} style={{ margin: 0 }}>
          <span>{error}</span>
        </div>
      )}

      {report && (
        <div className={styles.stack} style={{ marginTop: 12 }}>
          <div className={styles.grid}>
            <div>
              <p className={styles.label}>Период</p>
              <p className={styles.value}>
                {new Date(report.period.from).toLocaleString()} - {new Date(report.period.to).toLocaleString()}
              </p>
            </div>
            <div>
              <p className={styles.label}>Выручка</p>
              <p className={styles.value}>{report.revenue}</p>
            </div>
            <div>
              <p className={styles.label}>Завершено заказ-нарядов</p>
              <p className={styles.value}>{report.completedOrders}</p>
            </div>
            <div>
              <p className={styles.label}>Поступило заявок</p>
              <p className={styles.value}>{report.incomingRequests}</p>
            </div>
          </div>

          <div className={styles.tableWrapper}>
            <div className={styles.tableTitle}>Услуги по заказ-нарядам</div>
            <table className={styles.simpleTable}>
              <thead>
                <tr>
                  <th>Название</th>
                  <th>Кол-во</th>
                  <th>Цена</th>
                  <th>Сумма</th>
                </tr>
              </thead>
              <tbody>
                {report.services.map((item: FinancialReportServiceItem) => {
                  const details = item.service;
                  return (
                    <tr key={item.id}>
                      <td>
                        <div>{item.name}</div>
                        {details && (
                          <div className={styles.muted} style={{ fontSize: 12 }}>
                            {details.description || "Описание отсутствует"} | База:{" "}
                            {formatMoney(details.basePrice)} | Длительность:{" "}
                            {details.durationMin ? `${details.durationMin} мин` : "-"}
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: "right" }}>{item.quantity}</td>
                      <td style={{ textAlign: "right" }}>{formatMoney(item.unitPrice)}</td>
                      <td style={{ textAlign: "right" }}>{formatMoney(item.total)}</td>
                    </tr>
                  );
                })}
                {report.services.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", padding: 12 }}>
                      Нет данных: услуги отсутствуют
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className={styles.tableWrapper}>
            <div className={styles.tableTitle}>Запчасти по заказ-нарядам</div>
            <table className={styles.simpleTable}>
              <thead>
                <tr>
                  <th>Название</th>
                  <th>Кол-во</th>
                  <th>Цена</th>
                  <th>Сумма</th>
                </tr>
              </thead>
              <tbody>
                {report.parts.map((item: FinancialReportPartItem) => {
                  const details = item.part;
                  return (
                    <tr key={item.id}>
                      <td>
                        <div>{item.name}</div>
                        {details && (
                          <div className={styles.muted} style={{ fontSize: 12 }}>
                            Артикул: {details.article} | Ед.: {details.unit} | База:{" "}
                            {formatMoney(details.price)}
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: "right" }}>{item.quantity}</td>
                      <td style={{ textAlign: "right" }}>{formatMoney(item.unitPrice)}</td>
                      <td style={{ textAlign: "right" }}>{formatMoney(item.total)}</td>
                    </tr>
                  );
                })}
                {report.parts.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", padding: 12 }}>
                      Нет данных: запчасти отсутствуют
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
