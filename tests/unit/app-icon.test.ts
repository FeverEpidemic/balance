import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AppIcon, resolveCategoryIconName } from "@/components/ui/app-icon";

describe("resolveCategoryIconName", () => {
  it("maps food keywords in Indonesian and English to the food icon", () => {
    expect(resolveCategoryIconName("Makan Siang", "expense")).toBe("food");
    expect(resolveCategoryIconName("food delivery", "expense")).toBe("food");
    expect(resolveCategoryIconName("groceries mingguan", "expense")).toBe("food");
    expect(resolveCategoryIconName("resto keluarga", "expense")).toBe("food");
  });

  it("maps transport keywords to the transport icon", () => {
    expect(resolveCategoryIconName("Ojek kantor", "expense")).toBe("transport");
    expect(resolveCategoryIconName("transport harian", "expense")).toBe("transport");
    expect(resolveCategoryIconName("Bensin mobil", "expense")).toBe("transport");
  });

  it("maps salary keywords to the salary icon", () => {
    expect(resolveCategoryIconName("Gaji Bulanan", "income")).toBe("salary");
  });

  it("falls back to other-income for unmatched income categories", () => {
    expect(resolveCategoryIconName("Bonus tahunan khusus", "income")).toBe("other-income");
  });

  it("falls back to other-expense for unmatched expense categories", () => {
    expect(resolveCategoryIconName("Donasi spontan", "expense")).toBe("other-expense");
  });

  it("allows icons to inherit parent text color when requested", () => {
    const markup = renderToStaticMarkup(createElement(AppIcon, { name: "dashboard", tone: "inherit" }));

    expect(markup).toContain("text-inherit");
  });

  it("renders the help icon used by the AI assistant guide trigger", () => {
    const markup = renderToStaticMarkup(createElement(AppIcon, { name: "help" }));

    expect(markup).toContain("circle");
    expect(markup).toContain("stroke-current");
  });
});
