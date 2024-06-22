const { query } = await Service.import("applications");
const WINDOW_NAME = "applauncher";

/** 
 * @param {import('resource:///com/github/Aylur/ags/service/applications.js').Application} app 
 */
const AppItem = function(app) {
    return Widget.Button({
        on_clicked: function() {
            App.closeWindow(WINDOW_NAME);
            app.launch();
        },
        attribute: { app },
        child: Widget.Box({
            children: [
                Widget.Icon({
                    icon: app.icon_name || "",
                    size: 42,
                }),
                Widget.Label({
                    class_name: "title",
                    label: app.name,
                    xalign: 0,
                    vpack: "center",
                    truncate: "end",
                }),
            ],
        }),
    });
};

const Applauncher = function({ width = 500, height = 500, spacing = 12 }) {
    let applications = query("").map(AppItem);
    const list = Widget.Box({
        vertical: true,
        children: applications,
        spacing: spacing,
    });

    function repopulate() {
        applications = query("").map(AppItem);
        list.children = applications;
    }

    const entry = Widget.Entry({
        hexpand: true,
        css: `margin-bottom: ${spacing}px;`,
        on_accept: function() {
            const results = applications.filter(function(item) {
                return item.visible;
            });
            if (results[0]) {
                App.toggleWindow(WINDOW_NAME);
                results[0].attribute.app.launch();
            }
        },
        on_change: function({ text }) {
            applications.forEach(function(item) {
                item.visible = item.attribute.app.match(text ?? "");
            });
        },
    });

    return Widget.Box({
        class_name: "applauncher",
        vertical: true,
        css: `margin: ${spacing * 2}px;`,
        children: [
            entry,
            Widget.Scrollable({
                hscroll: "never",
                css: `min-width: ${width}px; min-height: ${height}px;`,
                child: list,
            }),
        ],
        setup: function(self) {
            self.hook(App, function(_, windowName, visible) {
                if (windowName !== WINDOW_NAME) return;
                // when the applauncher shows up
                if (visible) {
                    repopulate();
                    entry.text = "";
                    entry.grab_focus();
                }
            });
        },
    });
};

export const applauncher = Widget.Window({
    name: WINDOW_NAME,
    setup: function(self) {
        self.keybind("Escape", function() {
            App.closeWindow(WINDOW_NAME);
        });
    },
    visible: false,
    keymode: "exclusive",
    child: Applauncher({
        width: 500,
        height: 500,
        spacing: 12,
    }),
});
