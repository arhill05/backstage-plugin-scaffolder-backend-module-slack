# backstage-plugin-scaffolder-backend-module-slack

This is a `slack` actions plugin for the `scaffolder-backend` in Backstage.

This contains a collection of actions for using to send Slack messages.

## Prerequisites

- Node must be installed in the environment your Backstage instance is running in, but it will most likely already be there since your Backstage instance runs in Node.

- You must have a Slack webhook URL available to send messages to

## Getting Started

In the root directory of your Backstage project:

```shell
yarn add --cwd packages/backend @mdude2314/backstage-plugin-scaffolder-backend-module-slack
```

Add the actions you'd like to the scaffolder:

```typescript
// packages/backend/src/plugins/scaffolder.ts

import {
  createSendSlackMessageViaWebhookAction
} from '@mdude2314/backstage-plugin-scaffolder-backend-module-slack'

import { ScmIntegrations } from '@backstage/integration';
import { createBuiltinActions, createRouter } from '@backstage/plugin-scaffolder-backend';

...

const integrations = ScmIntegrations.fromConfig(env.config);
const builtInActions = createBuiltinActions({
  catalogClient,
  integrations,
  config: env.config,
  reader: env.reader
});

const actions = [
    createSendSlackMessageViaWebhookAction({config: env.config}),
  ...builtInActions
];

return await createRouter({
  logger: env.logger,
  config: env.config,
  database: env.database,
  reader: env.reader,
  catalogClient,
  actions
});
```

Add a Slack configuration section to your app-config.yaml.

> You can omit this by providing a webhook URL in the input of the step in your scaffolder template, but it must be present in one place or the other.

```yaml
# app-config.yaml

slack:
  webhookUrl: "https://example.com"
```

## Example of using the send message action in a template

```yaml
apiVersion: scaffolder.backstage.io/v1beta3
kind: Template
metadata:
  name: slack-message-demo
  title: My Slack message demo
  description: Send a message via Slack
spec:
  owner: mdude2314
  type: service

  steps:
    - id: send-slack-message
      name: Send slack message
      action: slack:sendMessage
      input:
        message: "Hello, world!"
        webhookUrl: "https://example.com" # optional if the URL is supplied in the app-config.yaml
```
