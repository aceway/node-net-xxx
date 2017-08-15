/*
  node-net-xxx 配置文件;
  因 json 文件不支持写注释,且格式过于严格,故用 js 里的 json 对象做配置
*/
const config = {
  "monitor": [            // 为监控本 node-net-xxx 状况创建的监听端口
    {schema: "http", host:"192.168.1.99", port: 2000},
  ],
  "inputter": [           // 为接收外部数据创建的监听端口
    {schema: "http", host: "127.0.0.1", port: 3000},
    {schema: "ws",   host: "127.0.0.1", port: 3001},
  ],
  "listen_outputter": [   // 为输出数据创建的监听端口
    {schema: "http", host: "localhost", port: 4000},
    {schema: "ws",   host: "localhost", port: 4001},
  ],
  "connect_outputter": [  // 为输出主动连接其它端口
    {schema: "http", host: "localhost", port: 5000},
    {schema: "ws",   host: "localhost", port: 5001},
    //{schema: "http", host: "host_ip",   port: 2000},  // 测试,通过配置系统 host 配置成环路
    //{schema: "http", host: "localhost", port: 3000},  // 测试,配置成环路
  ]
};

module.exports = config;
