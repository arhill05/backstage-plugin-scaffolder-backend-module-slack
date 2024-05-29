import {
  coreServices,
  createBackendModule,
} from "@backstage/backend-plugin-api";
import { scaffolderActionsExtensionPoint } from "@backstage/plugin-scaffolder-node/alpha";
import {
  createSendSlackMessageViaWebhookAction,
  createSendSlackMessageViaSlackApiAction,
} from "./actions";

export const scaffolderModuleSendSlackMessage = createBackendModule({
  pluginId: "scaffolder",
  moduleId: "slack",
  register({ registerInit }) {
    registerInit({
      deps: {
        scaffolder: scaffolderActionsExtensionPoint,
        config: coreServices.rootConfig,
      },
      async init({ scaffolder, config }) {
        scaffolder.addActions(
          createSendSlackMessageViaWebhookAction({ config }),
          createSendSlackMessageViaSlackApiAction({ config })
        );
      },
    });
  },
});
