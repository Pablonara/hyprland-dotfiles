function NotificationIcon(appEntry, appIcon, image) {
    if (image) {
        return Widget.Box({
            css: `background-image: url("${image}"); background-size: contain; background-repeat: no-repeat; background-position: center;`,
        });
    }

    // determine icon based on appEntry or appIcon if no image
    let icon = "dialog-information-symbolic";
    if (Utils.lookUpIcon(appIcon)) {
        icon = appIcon;
    }
    if (appEntry && Utils.lookUpIcon(appEntry)) {
        icon = appEntry;
    }

    return Widget.Box({
        child: Widget.Icon(icon),
    });
}

function Notification(n) {
    const icon = Widget.Box({
        vpack: "start", 
        class_name: "icon", 
        child: NotificationIcon(n.app_entry, n.app_icon, n.image), 
    });

    const title = Widget.Label({
        class_name: "title", // css stuff
        xalign: 0, 
        justification: "left", 
        hexpand: true, 
        max_width_chars: 24, 
        truncate: "end", 
        wrap: true, 
        label: n.summary, 
        use_markup: true, 
    });

    const body = Widget.Label({
        class_name: "body", 
        hexpand: true, 
        use_markup: true, 
        xalign: 0, 
        justification: "left", 
        label: n.body, 
        wrap: true, 
    });

    // create action buttons box
    const actions = Widget.Box({
        class_name: "actions", 
        children: n.actions.map(function(action) {
            return Widget.Button({
                class_name: "action-button", 
                on_clicked: function() { 
                    n.invoke(action.id); 
                    n.dismiss(); 
                },
                hexpand: true, 
                child: Widget.Label(action.label), 
            });
        }),
    });


    return Widget.EventBox({
        attribute: { id: n.id }, 
        on_primary_click: n.dismiss,
    }, Widget.Box({
        class_name: `notification ${n.urgency}`,
        vertical: true,
        children: [
            icon,
            Widget.Box({
                vertical: true,
                children: [title, body], 
            }),
            actions,
        ],
    }));
}

export function NotificationPopups(monitor = 0) {
    const list = Widget.Box({
        vertical: true, 
        children: notifications.popups.map(function(notification) { 
            return Notification(notification);
        }),
    });

    function onNotified(_, id) {
        const n = notifications.getNotification(id);
        if (n) {
            list.children = [Notification(n), ...list.children]; 
        }
    }

    function onDismissed(_, id) {
        const notificationToRemove = list.children.find(function(n) { 
            return n.attribute.id === id;
        });
        if (notificationToRemove) {
            notificationToRemove.destroy(); 
        }
    }

    list.hook(notifications, onNotified, "notified").hook(notifications, onDismissed, "dismissed");

    return Widget.Window({
        monitor,
        name: `notifications${monitor}`,
        class_name: "notification-popups", 
        anchor: ["top", "right"],
        child: Widget.Box({
            css: "min-width: 2px; min-height: 2px;", 
            class_name: "notifications", 
            vertical: true, 
            child: list, 
        }),
    });
}
