import {
  REQUEST_STATUS_LABELS,
  RequestStatus,
  ServiceRequestWithClient,
} from "@features/service-request/api/serviceRequestApi";
import styles from "../../dashboard/dashboard.module.scss";

interface ServiceRequestCardProps {
  request: ServiceRequestWithClient;
}

const statusClassName: Record<RequestStatus, string> = {
  NEW: "statusNew",
  CONFIRMED: "statusConfirmed",
  CANCELLED: "statusCancelled",
  COMPLETED: "statusCompleted",
};

export function ServiceRequestCard({ request }: ServiceRequestCardProps) {
  const statusClass = styles[statusClassName[request.status]] ?? "";

  return (
    <div className={styles.requestCard}>
      <div className={styles.requestHeader}>
        <div>
          <p className={styles.requestTitle}>
            Заявка {request.id}
          </p>
          <div className={styles.requestMeta}>
            <span>
              {request.vehicle.make} {request.vehicle.model} ({request.vehicle.licensePlate})
            </span>
            {request.vehicle.year && <span>{request.vehicle.year}</span>}
          </div>
        </div>
        <span className={`${styles.statusBadge} ${statusClass}`}>
          {REQUEST_STATUS_LABELS[request.status]}
        </span>
      </div>

      <div className={styles.requestMeta}>
        <span>
          Клиент: {request.client.name} {request.client.surname}
        </span>
        <span>{request.client.phone}</span>
        <span>{request.client.email}</span>
      </div>

      {request.comment && (
        <p className={styles.requestComment}>Комментарий: {request.comment}</p>
      )}

      <div className={styles.requestMeta}>
        {request.desiredDate && (
          <span>
            Желаемая дата: {new Date(request.desiredDate).toLocaleString("ru-RU")}
          </span>
        )}
        <span>Создана: {new Date(request.createdAt).toLocaleString("ru-RU")}</span>
        <span>Статус: {REQUEST_STATUS_LABELS[request.status]}</span>
      </div>
    </div>
  );
}
