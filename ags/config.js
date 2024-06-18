// volume query with pactl
const pactl = Variable({ count: 0, msg: '' }, {
    listen: ['pactl subscribe', (msg) => ({
        count: pactl.value.count + 1,
        msg: msg,
    })],
})

pactl.connect('changed', ({ value }) => {
    print(value.msg, value.count)
})

const label = Widget.Label({
    label: pactl.bind().as(({ count, msg }) => {
        return `${msg} ${count}`
    }),
})

// widgets are GObjects too
label.connect('notify::label', ({ label }) => {
    print('label changed to ', label)
})


// battery 
const battery = await Service.import('battery')

const batteryProgress = Widget.CircularProgress({
    value: battery.bind('percent').as(p => p / 100),
    child: Widget.Icon({
        icon: battery.bind('icon_name'),
    }),
})



function Bar(monitor = 0) {

    const dateLabel = Widget.Label({
        label: 'some example content',
    });

    Utils.interval(1000, () => {
        dateLabel.label = Utils.exec('date');
    });

    return Widget.Window({
        monitor,
        name: `bar${monitor}`,
        anchor: ['top', 'left', 'right'],
        child: dateLabel,
    });
}


//const Bar = (monitor = 0) => Widget.Window({
//    monitor,
//    name: `bar${monitor}`,
//    anchor: ['top', 'left', 'right'],
//    child: Widget.Label()
//        .poll(1000, label => label.label = Utils.exec('date')),
//})

App.config({
    windows: [
        Bar(0), // instantiate per monitor
        Bar(1),
    ],
})

