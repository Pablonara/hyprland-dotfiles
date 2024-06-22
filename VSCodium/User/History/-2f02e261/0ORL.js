import { applauncher } from "./applauncher.js"
import { NotificationPopups } from "./notificationPopups.js"

const hyprland = await Service.import("hyprland")
const notifications = await Service.import("notifications")
const mpris = await Service.import("mpris")
const audio = await Service.import("audio")
const battery = await Service.import("battery")
const systemtray = await Service.import("systemtray")
const network = await Service.import('network')


// notifications test


Utils.timeout(100, () => Utils.notify({ 
    summary: "hello test1",
    iconName: "info-symbolic",
    body: "google en passant "
        + "holy hell",
    actions: {
        "Cool": () => print("pressed Cool"),
    },
}))


// battery 

const date = Variable("", {
    poll: [1000, 'date "+%H:%M:%S %b %e"'],
})

function Workspaces() {
    const activeId = hyprland.active.workspace.bind("id")

    const workspaces = Array.from({ length: 10 }, (_, index) => {
        const id = index + 1;
        let buttonProps = {
            on_clicked: function () {
                hyprland.messageAsync(`dispatch workspace ${id}`);
            },
        };

        // Add child and class_name properties for IDs other than -98 if you are planning to work with hidden workspaces
        if (id !== -98) {
            buttonProps.child = Widget.Label(`${id}`);
            buttonProps.class_name = activeId.as(function (i) {
                return i === id ? "focused" : "";
            });
        }

        return Widget.Button(buttonProps);
    });



    return Widget.Box({
        class_name: "workspaces",
        children: workspaces,
    })
}



function WifiIndicator() {
    return Widget.Box({
        children: [
            Widget.Icon({
                icon: network.wifi.bind('icon_name'),
            }),
            Widget.Label({
                label: network.wifi.bind('ssid')
                   .as(function(ssid) { return ssid || 'N/A'; }),
            }),
        ],
    });
}

function WiredIndicator() {
    return Widget.Icon({
        icon: network.wired.bind('icon_name'),
    });
}

function NetworkIndicator() { // call both indicators because not sure whether will use lan or wlan
    return Widget.Stack({
        class_name: "internet",
        children: {
            wifi: WifiIndicator(),
            wired: WiredIndicator(),
        },
        shown: network.bind('primary').as(function(p) { return p || 'wifi'; }),
    });
}



function ClientTitle() {
    return Widget.Label({
        class_name: "client-title",
        label: hyprland.active.client.bind("title"),
    })
}


function Clock() {
    return Widget.Label({
        class_name: "clock",
        label: date.bind(),
    })
}


// don't need dunst or any other notification daemon
// because the module is a notification daemon itself
function Notification() {
    const popups = notifications.bind("popups")
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
    })
}


function Media() {
    const label = Utils.watch("", mpris, "player-changed", () => {
        if (mpris.players[0]) {
            const { track_artists, track_title } = mpris.players[0]
            return `${track_artists.join(", ")} - ${track_title}`
        } else {
            return "Nothing is playing"
        }
    })

    return Widget.Button({
        class_name: "media",
        on_primary_click: () => mpris.getPlayer("")?.playPause(),
        on_scroll_up: () => mpris.getPlayer("")?.next(),
        on_scroll_down: () => mpris.getPlayer("")?.previous(),
        child: Widget.Label({ label }),
    })
}

const { speaker } = await Service.import("audio")

function Volume() {
    const icons = {
        101: "overamplified",
        67: "high",
        34: "medium",
        1: "low",
        0: "muted",
    }

    var volNum = audio.speaker.volume;

    function getIcon() {
        const icon = audio.speaker.is_muted ? 0 : [101, 67, 34, 1, 0].find(
            threshold => threshold <= audio.speaker.volume * 100)

        return `audio-volume-${icons[icon]}-symbolic`
    }

    function getVolume() {
        // Check if the speaker is muted
        if (audio.speaker.is_muted) {
            return 0; // If muted, volume percentage is 0%
        } else {
            // Calculate the volume percentage based on current volume
            const volumePercentage = audio.speaker.volume * 100;
            return volumePercentage.toFixed(2); // Return percentage rounded to two decimal places
        }
    }

    const icon = Widget.Icon({
        class_name: "volumeIcon",
        icon: Utils.watch(getIcon(), audio.speaker, getIcon),
        tooltip_text: String(`Volume ${Math.floor(getVolume())}%`) // this doesnt work fix later
    })

    const slider = Widget.Slider({
        hexpand: true,
        draw_value: false,
        on_change: function (event) {
            const sliderValue = event.value;
            audio.speaker.volume = sliderValue;
            let volNum = event.value
        },
        setup: self => self.hook(audio.speaker, () => {
            self.value = audio.speaker.volume || 0
        }),
    })

    const volumePercent = Widget.Label({
        label: Utils.watch(getVolume(), audio.speaker, getVolume),
        // label: String(audio.speaker.volume || 0),
    })
    Utils.interval(1000, () => {
    })

    return Widget.Box({
        class_name: "volume",
        css: "min-width: 180px",
        children: [icon, slider, volumePercent],
    })
}


function Battery() {
    const value = battery.bind("percent").as(p => p > 0 ? p / 100 : 0)
    const icon = battery.bind("percent").as(p =>
        `battery-level-${Math.floor(p / 10) * 10}-symbolic`)
        
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
    })
}

// layout of the bar
function Left() {
    return Widget.Box({
        spacing: 8,
        children: [
            Workspaces(),
            ClientTitle(),
        ],
    })
}

function Right() {
    return Widget.Box({
        hpack: "end",
        spacing: 8,
        children: [
            NetworkIndicator(),
            Battery(),
            Volume(),
            Notification(),
        ],
    })
}

function Center() {
    return Widget.Box({
        spacing: 8,
        children: [
            Clock(),
            Media(),
        ],
    })
}

function Bar(monitor = 0) {
    return Widget.Window({
        name: `bar-${monitor}`, // name has to be unique because linux stuff
        class_name: "bar",
        monitor,
        anchor: ["top", "left", "right"],
        exclusivity: "exclusive",
        child: Widget.CenterBox({
            start_widget: Left(),
            center_widget: Center(),
            end_widget: Right(),
        }),
    })
}



//const Bar = (monitor = 0) => Widget.Window({
//    monitor,
//    name: `bar${monitor}`,
//    anchor: ['top', 'left', 'right'],
//    child: Widget.Label()
//        .poll(1000, label => label.label = Utils.exec('date')),
//})

App.config({
    style: "./styles.css",
    windows: [
        Bar(0), // instantiate per monitor in case of multiple monitors
        // Bar(1),
        applauncher,
        NotificationPopups(),
    ],
})

export { }