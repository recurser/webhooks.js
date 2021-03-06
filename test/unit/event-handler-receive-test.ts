import { receiverHandle as receive } from "../../src/event-handler/receive";
import { State } from "../../src/types";

const state: State = {
  secret: "mysecret",
  hooks: {},
};

test("options: none", () => {
  // @ts-expect-error
  expect(() => receive(state)).toThrow();
});

test("options: name", () => {
  expect(() => {
    // @ts-expect-error
    receive(state, { name: "foo" });
  }).toThrow();
});

test("options: name, payload", () => {
  expect(() => {
    // @ts-expect-error
    receive(state, { name: "foo", payload: {} });
  }).not.toThrow();
});
