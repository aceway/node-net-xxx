/*
  node-net-xxx 配置文件;
  因 json 文件不支持写注释,且格式过于严格,故用 js 里的 json 对象做配置
*/
const config = {
  max_data_size: 1024*1024, // 允许的单个最大数据包-字节
  parts: {
    // monitor 监控本 node-net-xxx 状况创建的监听端口, 只支持作为服务端 listen 
    "monitor": [            // 
      {schema: "http", host:"192.168.1.99", port: 2000, response: false},
      //{schema: "http", host:"127.0.0.1",    port: 2001},
      {schema: "ws",   host:"127.0.0.1",    port: 2002},
      {schema: "tcp",   host:"127.0.0.1",    port: 2003},
    ],
    // inputter 接收外部数据创建的监听端口,只支持作为服务端 listen 
    "inputter": [
      {schema: "http", host: "127.0.0.1", port: 3000},
      //{schema: "ws",   host: "127.0.0.1", port: 3001},
      //{schema: "tcp",   host: "127.0.0.1", port: 3002, response: true},
    ],
    // outputter 输出数据创建的监听端口, 支持作为服务端 listen 
    "listen_outputter": [   // 
      //{schema: "http", host: "localhost", port: 4000},
      //{schema: "ws",   host: "localhost", port: 4001},
    ],
    // outputter 输出主动连接其它端口, 支持作为客户端去 connect 其它服务端口
    "connect_outputter": [  // 
      //{schema: "http", host: "localhost", port: 5000},
      //{schema: "ws",   host: "localhost", port: 2002},    // 测试,通过配置系统 host 配置成环路
      {schema: "tcp",   host: "localhost", port: 2003},    // 测试,通过配置系统 host 配置成环路
      //{schema: "http", host: "host_ip",   port: 2000},  // 测试,配置成环路
      //{schema: "http", host: "localhost", port: 3000},  // 测试,配置成环路
    ]
  }
};

module.exports = config;
