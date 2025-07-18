// Assume Service and Utils are defined elsewhere in your code.

// Function to create a box containing an icon or image for notifications.
function NotificationIcon(appEntry, appIcon, image) {
    if (image) {
        // If there's an image, create a box with the image as background.
        return Widget.Box({
            css: `background-image: url("${image}"); background-size: contain; background-repeat: no-repeat; background-position: center;`,
        });
    }

    // If no image, determine icon based on appEntry or appIcon.
    let icon = "dialog-information-symbolic";
    if (Utils.lookUpIcon(appIcon)) {
        icon = appIcon;
    }
    if (appEntry && Utils.lookUpIcon(appEntry)) {
        icon = appEntry;
    }

    // Create a box containing an icon determined above.
    return Widget.Box({
        child: Widget.Icon(icon),
    });
}

// Function to create a notification widget.
function Notification(n) {
    // Create icon box using NotificationIcon function.
    const icon = Widget.Box({
        vpack: "start", // Align content vertically at the top.
        class_name: "icon", // Apply a CSS class for styling.
        child: NotificationIcon(n.app_entry, n.app_icon, n.image), // Use NotificationIcon function to get icon or image.
    });

    // Create a title label for the notification.
    const title = Widget.Label({
        class_name: "title", // Apply a CSS class for styling.
        xalign: 0, // Align text to the left horizontally.
        justification: "left", // Align text to the left within its space.
        hexpand: true, // Allow the widget to expand horizontally.
        max_width_chars: 24, // Limit the maximum width in characters.
        truncate: "end", // Truncate text that exceeds the width.
        wrap: true, // Enable wrapping of text.
        label: n.summary, // Set the text content of the label.
        use_markup: true, // Enable interpreting the label text as markup.
    });

    // Create a body label for the notification.
    const body = Widget.Label({
        class_name: "body", // Apply a CSS class for styling.
        hexpand: true, // Allow the widget to expand horizontally.
        use_markup: true, // Enable interpreting the label text as markup.
        xalign: 0, // Align text to the left horizontally.
        justification: "left", // Align text to the left within its space.
        label: n.body, // Set the text content of the label.
        wrap: true, // Enable wrapping of text.
    });

    // Create action buttons box for the notification.
    const actions = Widget.Box({
        class_name: "actions", // Apply a CSS class for styling.
        children: n.actions.map(function(action) { // Map through actions and create buttons.
            return Widget.Button({
                class_name: "action-button", // Apply a CSS class for styling.
                on_clicked: function() { // Set up click handler.
                    n.invoke(action.id); // Invoke the action associated with the button.
                    n.dismiss(); // Dismiss the notification after invoking action.
                },
                hexpand: true, // Allow the button to expand horizontally.
                child: Widget.Label(action.label), // Set the button label.
            });
        }),
    });

    // Create an event box containing the notification content.
    return Widget.EventBox({
        attribute: { id: n.id }, // Set an attribute with the notification ID.
        on_primary_click: n.dismiss, // Set primary click handler to dismiss the notification.
    }, Widget.Box({
        class_name: `notification ${n.urgency}`, // Apply CSS classes for styling.
        vertical: true, // Arrange content vertically.
        children: [
            icon,
            Widget.Box({
                vertical: true,
                children: [title, body], // Nest title and body labels.
            }),
            actions, // Include action buttons.
        ],
    }));
}

// Function to create a popup window containing notifications.
export function NotificationPopups(monitor = 0) {
    // Create a box to hold multiple notifications vertically.
    const list = Widget.Box({
        vertical: true, // Arrange notifications vertically.
        children: notifications.popups.map(function(notification) { // Map through popups and create notifications.
            return Notification(notification);
        }),
    });

    // Function to handle notifications being added.
    function onNotified(_, id) {
        const n = notifications.getNotification(id); // Retrieve notification by ID.
        if (n) {
            list.children = [Notification(n), ...list.children]; // Prepend new notification to the list.
        }
    }

    // Function to handle notifications being dismissed.
    function onDismissed(_, id) {
        const notificationToRemove = list.children.find(function(n) { // Find notification by ID.
            return n.attribute.id === id;
        });
        if (notificationToRemove) {
            notificationToRemove.destroy(); // Remove the notification from the list.
        }
    }

    // Hook notifications to update the list on changes.
    list.hook(notifications, onNotified, "notified").hook(notifications, onDismissed, "dismissed");

    // Create a window to contain the notification popups.
    return Widget.Window({
        monitor,
        name: `notifications${monitor}`,
        class_name: "notification-popups", // Apply a CSS class for styling.
        anchor: ["top", "right"], // Anchor window to top-right corner.
        child: Widget.Box({
            css: "min-width: 2px; min-height: 2px;", // Set minimum dimensions for the box.
            class_name: "notifications", // Apply a CSS class for styling.
            vertical: true, // Arrange content vertically.
            child: list, // Include the list of notifications.
        }),
    });
}
