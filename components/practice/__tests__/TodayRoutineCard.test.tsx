import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";

import { TodayRoutineCard } from "@/components/practice/TodayRoutineCard";
import type { RoutineConfig, RoutineStatus } from "@/lib/progress";

function makeStatus(items: { id: string; done: boolean }[]): RoutineStatus {
  return {
    done: items.filter((i) => i.done).length,
    total: items.length,
    items,
  };
}

describe("<TodayRoutineCard />", () => {
  it("renders the header label and the progress count", () => {
    const routine: RoutineConfig = {
      exerciseIds: ["five-note-scale-mee-may-mah", "rossini-lip-trill"],
    };
    const status = makeStatus([
      { id: "five-note-scale-mee-may-mah", done: true },
      { id: "rossini-lip-trill", done: false },
    ]);
    render(<TodayRoutineCard routine={routine} status={status} onPressEdit={() => {}} />);

    expect(screen.getByText("TODAY'S ROUTINE")).toBeTruthy();
    expect(screen.getByText("1 of 2 done")).toBeTruthy();
    expect(screen.getByText("Five-Note Scale: Mee May Mah")).toBeTruthy();
    expect(screen.getByText("Rossini Lip Trill")).toBeTruthy();
  });

  it("shows 'Routine done' when every item is complete", () => {
    const routine: RoutineConfig = { exerciseIds: ["five-note-scale-mee-may-mah"] };
    const status = makeStatus([{ id: "five-note-scale-mee-may-mah", done: true }]);
    render(<TodayRoutineCard routine={routine} status={status} onPressEdit={() => {}} />);

    expect(screen.getByText("Routine done")).toBeTruthy();
    expect(screen.queryByText("1 of 1 done")).toBeNull();
  });

  it("renders the empty state when no exercises are configured", () => {
    render(
      <TodayRoutineCard
        routine={{ exerciseIds: [] }}
        status={{ done: 0, total: 0, items: [] }}
        onPressEdit={() => {}}
      />,
    );

    expect(
      screen.getByText("No exercises in your routine. Tap Edit to add some."),
    ).toBeTruthy();
  });

  it("fires onItemPress with the item id when a row is tapped", () => {
    const onItemPress = jest.fn();
    const routine: RoutineConfig = {
      exerciseIds: ["five-note-scale-mee-may-mah", "rossini-lip-trill"],
    };
    const status = makeStatus([
      { id: "five-note-scale-mee-may-mah", done: false },
      { id: "rossini-lip-trill", done: false },
    ]);
    render(
      <TodayRoutineCard
        routine={routine}
        status={status}
        onPressEdit={() => {}}
        onItemPress={onItemPress}
      />,
    );

    const trillRow = screen.getByLabelText("Practice Rossini Lip Trill");
    act(() => {
      fireEvent.click(trillRow);
    });
    expect(onItemPress).toHaveBeenCalledWith("rossini-lip-trill");
  });

  it("rows are non-interactive when onItemPress is omitted", () => {
    const routine: RoutineConfig = { exerciseIds: ["rossini-lip-trill"] };
    const status = makeStatus([{ id: "rossini-lip-trill", done: false }]);
    render(<TodayRoutineCard routine={routine} status={status} onPressEdit={() => {}} />);

    expect(screen.queryByLabelText("Practice Rossini Lip Trill")).toBeNull();
    // The label still renders via the inner Text node.
    expect(screen.getByText("Rossini Lip Trill")).toBeTruthy();
  });

  it("compact: collapsed row shows the routine eyebrow + Show-all affordance, expands to reveal items + Edit", () => {
    const routine: RoutineConfig = {
      exerciseIds: ["five-note-scale-mee-may-mah", "rossini-lip-trill"],
    };
    const status = makeStatus([
      { id: "five-note-scale-mee-may-mah", done: false },
      { id: "rossini-lip-trill", done: false },
    ]);
    render(<TodayRoutineCard routine={routine} status={status} onPressEdit={() => {}} compact />);

    expect(screen.getByText("TODAY'S ROUTINE")).toBeTruthy();
    expect(screen.getByText("Next: Five-Note Scale: Mee May Mah")).toBeTruthy();
    expect(screen.getByText("Show all")).toBeTruthy();
    expect(screen.getByLabelText("Edit routine")).toBeTruthy();
    expect(screen.queryByText("Rossini Lip Trill")).toBeNull();

    act(() => {
      fireEvent.click(screen.getByText("Show all"));
    });

    expect(screen.getByText("Five-Note Scale: Mee May Mah")).toBeTruthy();
    expect(screen.getByText("Rossini Lip Trill")).toBeTruthy();
    expect(screen.getByText("Edit routine — add or swap exercises")).toBeTruthy();
    expect(screen.getAllByLabelText("Edit routine").length).toBeGreaterThanOrEqual(1);
  });

  it("compact: tapping an item in the expanded list fires onItemPress and collapses", () => {
    const onItemPress = jest.fn();
    const routine: RoutineConfig = {
      exerciseIds: ["five-note-scale-mee-may-mah", "rossini-lip-trill"],
    };
    const status = makeStatus([
      { id: "five-note-scale-mee-may-mah", done: false },
      { id: "rossini-lip-trill", done: false },
    ]);
    render(
      <TodayRoutineCard
        routine={routine}
        status={status}
        onPressEdit={() => {}}
        onItemPress={onItemPress}
        compact
      />,
    );

    act(() => {
      fireEvent.click(screen.getByText("Show all"));
    });
    act(() => {
      fireEvent.click(screen.getByLabelText("Practice Rossini Lip Trill"));
    });
    expect(onItemPress).toHaveBeenCalledWith("rossini-lip-trill");
    expect(screen.queryByText("Five-Note Scale: Mee May Mah")).toBeNull();
    expect(screen.getByText("Show all")).toBeTruthy();
  });

  it("fires onPressEdit when the Edit button is tapped", () => {
    const onPressEdit = jest.fn();
    render(
      <TodayRoutineCard
        routine={{ exerciseIds: ["rossini-lip-trill"] }}
        status={makeStatus([{ id: "rossini-lip-trill", done: false }])}
        onPressEdit={onPressEdit}
      />,
    );

    const edit = screen.getByLabelText("Edit routine");
    act(() => {
      fireEvent.click(edit);
    });
    expect(onPressEdit).toHaveBeenCalledTimes(1);
  });
});
