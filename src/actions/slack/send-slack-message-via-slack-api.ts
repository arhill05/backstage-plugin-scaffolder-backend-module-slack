import {
  ActionContext,
  createTemplateAction,
} from "@backstage/plugin-scaffolder-node";
import { Config } from "@backstage/config";
import { InputError } from "@backstage/errors";
import { ChatPostMessageResponse, WebClient } from "@slack/web-api";
import { Constants } from "../../helpers/constants";

/**
 * Creates a `slack:sendMessage:conversation` Scaffolder action.
 *
 * @public
 */
export function createSendSlackMessageViaSlackApiAction(options: {
  config: Config;
}) {
  const { config } = options;

  return createTemplateAction<SlackActionContext>({
    id: "slack:sendMessage:conversation",
    description:
      "Sends a Slack message to a specific conversation via the Slack SDK. This requires you to install the application in your workspace and provide a token",
    schema: {
      input: {
        type: "object",
        required: ["message"],
        properties: {
          message: {
            title: "Message",
            description: "The message to send via webhook",
            type: "string",
          },
          conversationId: {
            title: "Conversation ID",
            description:
              "The ID of the conversation to send the message to. Either this or the conversation name must be specified here or in the app configuration. If both are specified, the conversation ID will be used.",
            type: "string",
          },
          conversationName: {
            title: "Conversation Name",
            description:
              "The name of the conversation to send the message to. This is only used if the conversation ID is not specified.",
            type: "string",
          },
          token: {
            title: "Auth Token",
            description:
              "The token to use to authenticate with the Slack API. This is only used if the token is not supplied in the app configuration.",
            type: "string",
          },
        },
      },
    },
    async handler(ctx: ActionContext<SlackActionContext>) {
      const token = getAndValidateSlackToken(ctx);
      const client = new WebClient(token);

      await validateScopesAsync(client);

      const { conversationId, channelName } =
        getAndValidateConversationIdAndChannelName(ctx);

      let conversationIdToUse;
      if (conversationId && conversationId !== "") {
        conversationIdToUse = conversationId;
      } else {
        conversationIdToUse = await getConversationIdBasedOnChannelNameAsync(
          client,
          channelName
        );
      }

      const result = await client.chat.postMessage({
        channel: conversationIdToUse,
        text: ctx.input.message,
      });

      if (result.error !== undefined) {
        logAndThrowError(ctx, result, conversationId);
      }
    },
  });

  async function validateScopesAsync(client: WebClient) {
    const response = await client.auth.test({});
    if (!response.ok) {
      throw new Error(
        "Something isn't right with the setup of the token used to authenticate with the Slack API. Please check the token and try again."
      );
    }

    const missingScopes = Constants.RequiredScopes.filter(
      (scope) => !response.response_metadata?.scopes?.includes(scope)
    );

    if (missingScopes.length > 0) {
      throw new Error(
        `The token provided does not have the correct scopes. Please ensure that the token has the following scopes: ${missingScopes.join(
          ", "
        )}`
      );
    }

    const result = await client.auth.test({});

    if (!result.ok) {
      throw new InputError(
        `The token provided does not have the correct scopes. Please ensure that the token has the following scopes: ${result.needed}`
      );
    }
  }

  function logAndThrowError(
    ctx: ActionContext<SlackActionContext>,
    result: ChatPostMessageResponse,
    conversationId: string | undefined
  ) {
    ctx.logger.error(
      `Something went wrong while trying to send a request to the Slack API - Error: ${result.error}`
    );
    ctx.logger.debug(`Response body: ${result.response_metadata}`);
    ctx.logger.debug(`Webhook URL: ${conversationId}`);
    ctx.logger.debug(`Input message: ${ctx.input.message}`);
    throw new Error(
      `Something went wrong while trying to send a request to the Slack API - Error: ${result.error}`
    );
  }

  async function getConversationIdBasedOnChannelNameAsync(
    client: WebClient,
    channelName: any
  ) {
    // search the Slack API for a conversation with a matching name, then return the id of that conversation
    const convo = await client.conversations.list({});

    if (convo.channels === undefined || convo.channels === null) {
      throw new InputError(
        "Conversation Name is not valid. Please check the Conversation Name and try again"
      );
    }

    const channel = convo.channels.find(
      (convoChannels) => convoChannels.name === channelName
    );

    if (channel === undefined || channel.id === undefined) {
      throw new InputError(
        "Conversation Name is not valid. Please check the Conversation Name and try again"
      );
    }

    return channel.id;
  }

  function getAndValidateSlackToken(ctx: ActionContext<SlackActionContext>) {
    const token = config.getOptionalString("slack.token") ?? ctx.input.token;
    if (!token) {
      throw new InputError(
        "Slack token is not specified in either the app-config or the action input. This must be specified in at least one place in order to send a message"
      );
    }
    return token;
  }

  function getAndValidateConversationIdAndChannelName(
    ctx: ActionContext<SlackActionContext>
  ) {
    const conversationId =
      config.getOptionalString("slack.conversationId") ??
      ctx.input.conversationId;

    const channelName =
      config.getOptionalString("slack.conversationName") ??
      ctx.input.conversationName;

    if (!conversationId && !channelName) {
      throw new InputError(
        "Neither Conversation ID nor Conversation Name is specified in either the app-config or the action input. One of these must be specified in at least one place in order to send a message"
      );
    }
    return { conversationId, channelName };
  }
}

type SlackActionContext = {
  message: string;
  conversationId?: string;
  conversationName?: string;
  token?: string;
};
