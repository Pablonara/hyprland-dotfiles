import { applauncher } from "./applauncher.js";
import { NotificationPopups } from "./notificationPopups.js";
import { media } from "./media.js";
import { Workspaces } from "./workspaces.js";

const hyprland = await Service.import("hyprland");
const notifications = await Service.import("notifications");
const mpris = await Service.import("mpris");
const audio = await Service.import("audio");
const battery = await Service.import("battery");
const systemtray = await Service.import("systemtray");
const network = await Service.import('network');

const date = Variable("", {
    poll: [1000, 'date "+%H:%M:%S %b %e"'],
});

function WifiIndicator() {
    return Widget.Box({
        children: [
            Widget.Icon({
                icon: network.wifi.bind('icon_name'),
            }),
            Widget.Label({
                label: network.wifi.bind('ssid')
                   .as(ssid => ssid || 'N/A'),
            }),
        ],
    });
}

function WiredIndicator() {
    return Widget.Icon({
        icon: network.wired.bind('icon_name'),
    });
}

function NetworkIndicator() {
    return Widget.Stack({
        class_name: "internet",
        children: {
            wifi: WifiIndicator(),
            wired: WiredIndicator(),
        },
        shown: network.bind('primary').as(p => p || 'wifi'),
    });
}

function ClientTitle() {
    return Widget.Label({
        class_name: "client-title",
        label: hyprland.active.client.bind("class"),
    });
}

function Clock() {
    return Widget.Label({
        class_name: "clock",
        label: date.bind(),
    });
}

function Notification() {
    const popups = notifications.bind("popups");
    return Widget.Box({
        class_name: "notification",
        visible: popups.as(p => p.length > 0),
        children: [
            Widget.Icon({
                icon: "preferences-system-notifications-symbolic",
            }),
            Widget.Label({
                label: popups.as(p => p[0]?.summary || ""),
            }),
        ],
    });
}

function Media() {
    const label = Utils.watch("", mpris, "player-changed", () => {
        if (mpris.players[0]) {
            const { track_artists, track_title } = mpris.players[0];
            return `${track_artists.join(", ")} - ${track_title}`;
        } else {
            return "Nothing is playing";
        }
    });

    return Widget.Button({
        class_name: "media",
        on_primary_click: () => mpris.getPlayer("")?.playPause(),
        on_scroll_up: () => mpris.getPlayer("")?.next(),
        on_scroll_down: () => mpris.getPlayer("")?.previous(),
        child: Widget.Label({ label }),
    });
}

function Volume() {
    const icons = {
        101: "overamplified",
        67: "high",
        34: "medium",
        1: "low",
        0: "muted",
    };

    function getIcon() {
        const icon = audio.speaker.is_muted ? 0 : [101, 67, 34, 1, 0].find(
            threshold => threshold <= audio.speaker.volume * 100);
        return `audio-volume-${icons[icon]}-symbolic`;
    }

    function getVolume() {
        if (audio.speaker.is_muted) {
            return 0;
        } else {
            const volumePercentage = audio.speaker.volume * 100;
            return volumePercentage.toFixed(2);
        }
    }

    const icon = Widget.Icon({
        class_name: "volumeIcon",
        icon: Utils.watch(getIcon(), audio.speaker, getIcon),
        tooltip_text: Utils.watch(getVolume() + "%", audio.speaker, getVolume)
    });

    const slider = Widget.Slider({
        hexpand: true,
        draw_value: false,
        on_change: ({ value }) => {
            audio.speaker.volume = value;
        },
        setup: self => self.hook(audio.speaker, () => {
            self.value = audio.speaker.volume || 0;
        }),
    });

    const volumePercent = Widget.Label({
        label: Utils.watch(getVolume().toString(), audio.speaker, getVolume),
    });

    return Widget.Box({
        class_name: "volume",
        css: "min-width: 180px",
        children: [icon, slider, volumePercent],
    });
}

function Battery() {
    const value = battery.bind("percent").as(p => p > 0 ? p / 100 : 0);
    const icon = battery.bind("percent").as(p =>
        `battery-level-${Math.floor(p / 10) * 10}-symbolic`);
        
    return Widget.Box({
        class_name: "battery",
        visible: battery.bind("available"),
        children: [
            Widget.Icon({ icon }),
            Widget.LevelBar({
                widthRequest: 140,
                vpack: "center",
                value,
            }),
        ],
    });
}

const SysTray = () => Widget.Box({
    children: systemtray.bind('items').as(items =>
        items.map(item => Widget.Button({
            child: Widget.Icon().bind('icon', item, 'icon'),
            onPrimaryClick: (_, event) => item.activate(event),
            onMiddleClick: (_, event) => item.secondaryActivate(event),
            onSecondaryClick: (_, event) => item.openMenu(event),
            tooltipMarkup: item.bind('tooltip_markup'),
        }))
    )
});

function Left() {
    return Widget.Box({
        spacing: 8,
        children: [
            ClientTitle(),
            Media(),
        ],
    });
}

function Center() {
    return Widget.Box({
        spacing: 8,
        children: [
            Clock(),
            Workspaces(),
        ],
    });
}

function Right() {
    return Widget.Box({
        hpack: "end",
        spacing: 0,
        children: [
            SysTray(),
            Notification(),
            NetworkIndicator(),
            Battery(),
            Volume(),
        ],
    });
}

function Bar(monitor = 0) {
    return Widget.Window({
        name: `bar-${monitor}`,
        class_name: "bar",
        monitor,
        margins: [5, 5, 0, 5],
        anchor: ["top", "left", "right"],
        exclusivity: "exclusive",
        child: Widget.CenterBox({
            start_widget: Left(),
            center_widget: Center(),
            end_widget: Right(),
        }),
    });
}

App.config({
    style: "./styles.css",
    windows: [
        Bar(0),
        applauncher,
        NotificationPopups(),
    ],
});
