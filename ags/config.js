const Bar = (monitor = 0) => Widget.Window({
    monitor,
    name: `bar${monitor}`,
    anchor: ['top', 'left', 'right'],
    child: Widget.Label()
        .poll(1000, label => label.label = Utils.exec('date')),
})

App.config({
    windows: [
        Bar(0), // instantiate per monitor
        Bar(1),
    ],
})
