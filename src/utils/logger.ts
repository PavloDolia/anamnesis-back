import { addColors, createLogger, transports, format } from "winston";

const { combine, colorize, timestamp } = format;

const logger = createLogger({
  format: combine(colorize(), timestamp({ format: "YYYY-MM-DD HH:mm:ss" })),
  transports: [],
});

addColors({
  debug: "white",
  error: "red",
  info: "green",
  warn: "yellow",
});

logger.add(
  new transports.Console({
    format: format.simple(),
  })
);

export const log = (dataToLog: {
  type: "info" | "error" | "debug" | "warn";
  method: string;
  info: Record<string, any>;
}) => {
  const { type, method, info } = dataToLog;
  logger[type](JSON.stringify({ method, info }));
};

export default logger;
