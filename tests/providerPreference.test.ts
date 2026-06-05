import { describe, expect, it } from "vitest";
import { getProviderOrder } from "../src/server/converter";

describe("getProviderOrder", () => {
  it("uses DashScope only when Aliyun Bailian is selected", () => {
    expect(getProviderOrder("dashscope")).toEqual(["dashscope"]);
  });

  it("keeps OpenAI then DashScope order for auto mode", () => {
    expect(getProviderOrder("auto")).toEqual(["openai", "dashscope"]);
  });

  it("uses local mock only when mock is selected", () => {
    expect(getProviderOrder("mock")).toEqual(["mock"]);
  });
});
