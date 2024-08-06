import { Alert } from "@mui/material"
import Notification from "./types/Notification";

interface NotificationComponentProps {
  notification: Notification;
}

const NotificationComponent = ({
  notification,
}: NotificationComponentProps) => {
  return (
    <Alert severity={notification.severity}>{notification.message}</Alert>
  )
}

export default NotificationComponent;
