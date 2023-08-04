import { Config } from '@backstage/config';
/**
 * Creates a `slack:sendMessage` Scaffolder action.
 *
 * @public
 */
export declare function createSendSlackMessageViaWebhookAction(options: {
    config: Config;
}): import("@backstage/plugin-scaffolder-node").TemplateAction<{
    message: string;
    webhookUrl?: string | undefined;
}, import("@backstage/types").JsonObject>;
