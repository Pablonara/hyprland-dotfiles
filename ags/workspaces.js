const Hyprland = await Service.import("hyprland");
const { Box, Button, EventBox } = Widget;

export const Workspaces = () => {
    const dispatch = (ws) => Hyprland.messageAsync(`dispatch workspace ${ws}`);

    return EventBox({
        onScrollUp: () => dispatch("+1"),
        onScrollDown: () => dispatch("-1"),
        className: "workspaces",
        child: Box({
            className: "outer-workspace",
            children: Array.from({ length: 9 }, (_, i) => i + 1).map(
                (i) =>
                    Box({
                        attribute: i,
                        className: "workspace",
                    })
            ),
        }).hook(Hyprland, (self) => {
            self.children.forEach((box) => {
                const isActive = Hyprland.active.workspace.id === box.attribute;
                const isOccupied = Hyprland.workspaces.some(
                    (item) => item.id === box.attribute
                );
                let buttonClassName;
                if (isActive) {
                    buttonClassName = "focused";
                    box.className = "workspace focused";
                } else if (isOccupied) {
                    buttonClassName = "occupied";
                    box.className = "workspace occupied";
                } else {
                    buttonClassName = "normal";
                    box.className = "workspace normal";
                }

                box.child = Button({
                    className: buttonClassName,
                    label: box.attribute.toString(),
                    onClicked: () => dispatch(box.attribute),
                });
            });
        }),
    });
};
