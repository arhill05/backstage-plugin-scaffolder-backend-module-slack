export interface Config {
    slack: {
        /**
         * 
         * This is required if you're using a Slack webhook URL to send messages and you
         * don't intend to supply the webhook URL from the action inputs.
         * 
         * @visibility secret
         */
        webhookUrl?: string;
        /**
         * 
         * These are required if you are using the Slack API to send messages and you 
         * don't intend to supply these from the action inputs.
         * 
         * @visibility secret
         */
        token?: string;
        /**
         * 
         * The ID of the conversation to send messages to. Either this or the conversationName 
         * are required here if you don't intend to supply either from the action inputs.
         * 
         * @visibility backend
         */
        conversationId?: string;
        /**
         * The name of the conversation to send messages to. Either this or the conversationId 
         * are rqeuired here if you don't intend to supply either from the action inputs.
         * 
         * @visibility backend
         */
        conversationName?: string;
    };
};
