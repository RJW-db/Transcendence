declare module "pino-caller" {
  import { Logger } from "pino";
  function pinoCaller(
    logger: Logger,
    options?: {
      relativeTo?: string;
      stackAdjustment?: number;
    }
  ): Logger;

  export default pinoCaller;
}
