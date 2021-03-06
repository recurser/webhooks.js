const { pascalCase } = require("pascal-case");
const TypeWriter = require("@gimenete/type-writer");
const webhooks = require("@octokit/webhooks-definitions/index.json");
const { generateFile } = require("./generate-file");

const tw = new TypeWriter();
const eventPayloadMapping = [
  ["error", "WebhookEventHandlerError"],
  ["*", "WebhookEvent<any>"],
];

const doNotEditThisFileDisclaimer = `
// THIS FILE IS GENERATED - DO NOT EDIT DIRECTLY
// make edits in scripts/generate-types.js`;
const eventPayloadsVariable = "EventPayloads";

const generatePayloadType = (typeName) => {
  const namedKeyPaths = {
    [`${typeName}.repository`]: "PayloadRepository",
    // This prevents a naming colision between the payload of a `installation_repositories` event
    // and the `repositories` attribute of a `installation` event
    "WebhookPayloadInstallation.repositories":
      "WebhookPayloadInstallation_Repositories",
  };

  if (typeName !== "WebhookPayloadMarketplacePurchase") {
    namedKeyPaths[`${typeName}.sender`] = "PayloadSender";
  }

  return {
    rootTypeName: typeName,
    namedKeyPaths,
  };
};

const generateEventNameType = (name, actions) => [
  name,
  ...actions.map((action) => {
    return `${name}.${action}`;
  }),
];

webhooks.forEach(({ name, actions, examples }) => {
  if (!examples) {
    return;
  }

  const typeName = `WebhookPayload${pascalCase(name)}`;
  tw.add(examples, generatePayloadType(typeName));

  if (tw.keypaths[`${typeName}Action`]) {
    delete tw.keypaths[`${typeName}Action`].string;

    actions.forEach(
      (action) => (tw.keypaths[`${typeName}Action`][`"${action}"`] = {})
    );
  }

  const eventNameTypes = generateEventNameType(name, actions);
  eventNameTypes.forEach((type) => {
    eventPayloadMapping.push([
      type,
      `WebhookEvent<${eventPayloadsVariable}.${typeName}>`,
    ]);
  });
});

tw.add(
  webhooks.flatMap(({ examples }) =>
    examples
      .map((example) => example.sender)
      .filter((sender) => sender !== undefined)
  ),
  {
    rootTypeName: "PayloadSender",
  }
);

const getWebhookPayloadTypeFromEvent = `
${doNotEditThisFileDisclaimer}

import { ${eventPayloadsVariable} } from "./event-payloads";
import { WebhookEvent, WebhookEventHandlerError } from "../types";

export interface EventTypesPayload {
  ${eventPayloadMapping.map(([name, type]) => `"${name}": ${type}`).join(`,\n`)}
}

export type WebhookEvents = keyof EventTypesPayload
`;

generateFile(
  "src/generated/get-webhook-payload-type-from-event.ts",
  getWebhookPayloadTypeFromEvent
);

const eventPayloadsContent = `
${doNotEditThisFileDisclaimer}

export declare module ${eventPayloadsVariable} {
  ${tw.generate("typescript", { inlined: false })}}
`;

generateFile("src/generated/event-payloads.ts", eventPayloadsContent);
