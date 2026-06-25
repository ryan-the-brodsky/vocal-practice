// MarkdownView renders the bounded Markdown subset the Learn articles use:
// headings, paragraphs, bold/italic/links inline, and unordered/ordered lists.

import React from "react";
import { render, screen } from "@testing-library/react";

import MarkdownView from "@/components/learn/MarkdownView";

const SAMPLE = [
  "# Big Title",
  "",
  "Intro with **bolded** and *slanted* and [a link](https://example.com).",
  "",
  "## A Section",
  "",
  "- first item",
  "- second item",
  "",
  "1. step one",
  "2. step two",
  "",
  "> a wise quote",
].join("\n");

describe("<MarkdownView />", () => {
  it("renders headings, inline formatting, links, lists, and quotes", () => {
    render(<MarkdownView content={SAMPLE} />);
    expect(screen.getByText("Big Title")).toBeTruthy();
    expect(screen.getByText("A Section")).toBeTruthy();
    expect(screen.getByText("bolded")).toBeTruthy();
    expect(screen.getByText("slanted")).toBeTruthy();
    expect(screen.getByText("a link")).toBeTruthy();
    expect(screen.getByText("first item")).toBeTruthy();
    expect(screen.getByText("second item")).toBeTruthy();
    expect(screen.getByText("step one")).toBeTruthy();
    expect(screen.getByText("a wise quote")).toBeTruthy();
  });
});
