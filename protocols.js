module.exports = {
    sacn: {
        defaults: {
            port: 5568,
            sourceName: "LCue Server",
            priority: 50,
            iface: "",
            minRefreshRate: 0,
            useUnicastDestination: ""
        },
        descriptions: {
            port: "Optional. The multicast port to use. All professional consoles broadcast to the default port.",
            sourceName: "The controller that sent the packet",
            universe: "Required. The universe to send to. Must be within 1-63999",
            iface: "Optional. Specifies the IPv4 address of the network interface/card to use. (For if your computer has multiple internet connections)",
            useUnicastDestination: "Optional. Setting this attribute to an IPv4 address will cause data to be sent directly to that device, instead of broadcasting to the whole LAN.",
            priority: "0-200. used if multiple controllers send to the same universe",
            
        }
    },
    "artnet": {
        defaults: {

        },
        descriptions: {
            host: ""
        }
    },
    "osc": {
        
    }
}