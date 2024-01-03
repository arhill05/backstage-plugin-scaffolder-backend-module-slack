import { PassThrough } from "stream";
import * as winston from "winston";
import { Config } from "@backstage/config";

import { createSendSlackMessageViaSlackApiAction } from "./send-slack-message-via-slack-api";
import { Constants } from "../../helpers/constants";

const mockAuthTest = jest.fn().mockResolvedValue({
  ok: true,
  response_metadata: {
    scopes: Constants.RequiredScopes,
  },
});
const mockChatPostMessage = jest.fn().mockResolvedValue({});

const mockLogger = {
  debug: jest.fn(),
  error: jest.fn(),
} as unknown as winston.Logger;

const mockImplementation = {
  auth: {
    test: mockAuthTest,
  },
  chat: {
    postMessage: mockChatPostMessage,
  },
};

jest.mock("@slack/web-api", () => {
  return {
    WebClient: jest.fn().mockImplementation(() => mockImplementation),
  };
});

const defaultHandlerOptions = {
  workspacePath: "/tmp",
  logStream: new PassThrough(),
  output: jest.fn(),
  createTemporaryDirectory() {
    throw new Error("Not implemented");
  },
};

describe("slack:sendMessage:conversation", () => {
  // beforeEach(() => {
  //   WebClient.mockImplementation(() => mockImplementation);
  // });
  it("should throw error if token is not defined", async () => {
    const action = createSendSlackMessageViaSlackApiAction({
      config: {
        getOptionalString: (_key: string): string | undefined => undefined,
      } as Config,
    });

    try {
      await action.handler({
        ...defaultHandlerOptions,
        input: {
          message: "Hello, world!",
        },
        logger: mockLogger,
      });
      throw new Error("This should not succeed");
    } catch (err: any) {
      // eslint-disable-next-line jest/no-conditional-expect
      expect(err.message).toContain(
        "Slack token is not specified in either the app-config or the action input. This must be specified in at least one place in order to send a message"
      );
    }
  });

  it("should validate that required scopes exist", async () => {
    // override global beforeEach mock
    mockAuthTest.mockResolvedValueOnce({
      ok: true,
      response_metadata: { scopes: [] },
    });

    const action = createSendSlackMessageViaSlackApiAction({
      config: {
        getOptionalString: (_key: string): string | undefined =>
          "some-config-value",
      } as Config,
    });

    try {
      await action.handler({
        ...defaultHandlerOptions,
        input: {
          message: "Hello, world!",
        },
        logger: mockLogger,
      });
      throw new Error("This should not succeed");
    } catch (err: any) {
      // eslint-disable-next-line jest/no-conditional-expect
      expect(err.message).toContain(
        "The token provided does not have the correct scopes. Please ensure that the token has the following scopes:"
      );
    }
  });

  it("should throw error if conversationId and conversationName are not defined", async () => {
    const action = createSendSlackMessageViaSlackApiAction({
      config: {
        getOptionalString: (_key: string): string | undefined =>
          _key === "slack.token" ? "test-token" : undefined,
      } as Config,
    });

    try {
      await action.handler({
        ...defaultHandlerOptions,
        input: {
          message: "Hello, world!",
        },
        logger: mockLogger,
      });
      throw new Error("This should not succeed");
    } catch (err: any) {
      // eslint-disable-next-line jest/no-conditional-expect
      expect(err.message).toContain(
        "Neither Conversation ID nor Conversation Name is specified in either the app-config or the action input. One of these must be specified in at least one place in order to send a message"
      );
    }
  });

  it("should call chat.postMessage with conversationId when provided", async () => {
    const action = createSendSlackMessageViaSlackApiAction({
      config: {
        getOptionalString: (_key: string): string | undefined =>
          _key === "slack.token" ? "some-config-value" : undefined,
      } as Config,
    });

    await action.handler({
      ...defaultHandlerOptions,
      input: {
        message: "Hello, world!",
        conversationId: "test-conversation-id",
      },
      logger: mockLogger,
    });

    const spy = jest.spyOn(mockImplementation.chat, "postMessage");

    expect(spy).toHaveBeenCalledWith({
      channel: "test-conversation-id",
      text: "Hello, world!",
    });
  });

  it("should throw error if postMessage returns an error", async () => {
    mockChatPostMessage.mockResolvedValue({ error: new Error("test error") });

    const action = createSendSlackMessageViaSlackApiAction({
      config: {
        getOptionalString: (_key: string): string | undefined =>
          _key === "slack.token" ? "some-config-value" : undefined,
      } as Config,
    });

    try {
      await action.handler({
        ...defaultHandlerOptions,
        input: {
          message: "Hello, world!",
          conversationId: "test-conversation-id",
        },
        logger: mockLogger,
      });
      throw new Error("This should not succeed");
    } catch (err: any) {
      // eslint-disable-next-line jest/no-conditional-expect
      expect(err.message).toContain(
        "Something went wrong while trying to send a request to the Slack API - Error:"
      );
    }
  });
});
