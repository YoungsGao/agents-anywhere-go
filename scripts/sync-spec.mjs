import { readFile, writeFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const source = await readFile(new URL('docs/prd/spec.md', root), 'utf8');
const modules = [
  {
    "id": "baseline",
    "prefix": "B",
    "name": "基线与兼容",
    "english": "BASELINE & CONTRACTS",
    "short": "基线",
    "icon": "layers",
    "description": "冻结原版组合，建立协议清单、样例与交叉联调基线。",
    "emphasis": "先确认我们要兼容什么。"
  },
  {
    "id": "server",
    "prefix": "S",
    "name": "Go Server",
    "english": "CONTROL PLANE",
    "short": "Server",
    "icon": "server",
    "description": "用 Gin＋GORM 实现认证、设备、会话、事件和 RPC 转发。",
    "emphasis": "手机与插件填写的实验室服务地址。"
  },
  {
    "id": "pi",
    "prefix": "P",
    "name": "Pi Python Connector",
    "english": "PI CONNECTOR",
    "short": "Pi",
    "icon": "terminal",
    "description": "用 Python 接入 Pi，复用原有设备协议与 ACP 能力。",
    "emphasis": "Pi 与原版 Runtime 可在同一个实验室工作流中选择。"
  },
  {
    "id": "deployment",
    "prefix": "D",
    "name": "部署与质量",
    "english": "DELIVERY & RELIABILITY",
    "short": "部署",
    "icon": "box",
    "description": "实验室 Docker 部署、持久化与恢复验证。",
    "emphasis": "真实手机可用，才算完成远程链路。"
  },
  {
    "id": "extension",
    "prefix": "E",
    "name": "MQ 学习增强",
    "english": "OPTIONAL EXTENSIONS",
    "short": "增强",
    "icon": "queue",
    "description": "用 RabbitMQ 演练统计聚合、Outbox、幂等与死信处理。",
    "emphasis": "可选扩展，独立验收。"
  }
];

const requirements = source.split(/\r?\n/).filter(line => /^\| [BSPDE]\d{2} \|/.test(line)).map(line => {
  const [id, phase, title, acceptance] = line.split('|').slice(1, -1).map(value => value.trim());
  const module = modules.find(item => item.prefix === id[0]).id;
  return { id, module, phase, title, acceptance, status: 'planned', optional: module === 'extension' };
});

if (!requirements.length || new Set(requirements.map(r => r.id)).size !== requirements.length) {
  throw new Error('The specification must contain unique requirement IDs.');
}

const data = {
  title: "Agents Anywhere · Go Rewrite",
  version: "PRD v1.1",
  updated: "2026-11-18",
  baseline: "98dd0e6",
  repository: "https://github.com/YoungsGao/agents-anywhere-go",
  reference: "https://youngsgao.github.io/pi-audit-harness/docs/prd/index.html#requirements",
  upstream: "https://github.com/anywhere-labs/Agents-Anywhere",
  sourceSnapshot: "https://github.com/anywhere-labs/Agents-Anywhere/tree/98dd0e6e5ddc1c5d1b35e1aaea6b5d00bdfd7008",
  modules,
  requirements,
  phases: [
    {
      "id": "M0",
      "title": "原版基线",
      "label": "原版先跑通",
      "description": "固定可用客户端和执行环境，记录续聊、新建、审批、断线的真实调用。",
      "exit": "同一部手机连上原 Server，能操作原 Connector；记录 Pi 的依赖与基线差异。",
      "deliverables": [
        "原版基线验收记录",
        "原 Server ＋ 上游 Python Connector"
      ],
      "dependency": "项目起点",
      "pair": "原 Server ＋ 上游 Python Connector"
    },
    {
      "id": "M1",
      "title": "Go Server 可用版",
      "label": "服务端首发",
      "description": "实现认证、会话、设备 RPC、Timeline、MySQL 迁移及 Docker 部署。",
      "exit": "手机通过 Go Server 续聊、查看输出；重启后历史可读，重复摄取可验证。",
      "deliverables": [
        "Go Server 可用版验收记录",
        "Go Server ＋ 上游 Python Connector"
      ],
      "dependency": "M0 阶段出口",
      "pair": "Go Server ＋ 上游 Python Connector"
    },
    {
      "id": "M2",
      "title": "Pi Python 接入",
      "label": "Pi 专项",
      "description": "接入真实 Pi，在固定工作目录验证发现、创建、续聊、中断和事件回传。",
      "exit": "原手机和 Web 可在 Go Server 选择 Pi；其他原版 Runtime 仍可照常使用。",
      "deliverables": [
        "Pi Python 接入验收记录",
        "Go Server ＋ Pi Python Connector"
      ],
      "dependency": "M1 阶段出口",
      "pair": "Go Server ＋ Pi Python Connector"
    },
    {
      "id": "M3",
      "title": "工作区与故障恢复",
      "label": "实验室验收",
      "description": "补齐服务端文件、终端转发、附件和队列；验证重连、重启及恢复。",
      "exit": "运行两个账号的隔离测试，重建容器并恢复一次真实会话。",
      "deliverables": [
        "工作区与故障恢复验收记录",
        "Go Server ＋ Pi / 原 Connector"
      ],
      "dependency": "M2 阶段出口",
      "pair": "Go Server ＋ Pi / 原 Connector"
    },
    {
      "id": "M4",
      "title": "服务端兼容覆盖",
      "label": "扩展 API",
      "description": "补齐冻结基线内的配置、计划与目标、管理统计和分享接口。",
      "exit": "每项服务端支持声明有客户端或协议测试记录。",
      "deliverables": [
        "服务端兼容覆盖验收记录",
        "原客户端与原 Connector 回归"
      ],
      "dependency": "M3 阶段出口",
      "pair": "原客户端与原 Connector 回归"
    },
    {
      "id": "M5",
      "title": "MQ 学习增强",
      "label": "可选迭代",
      "description": "为已存在的统计或附件任务增加 Outbox、RabbitMQ 和幂等消费。",
      "exit": "重复投递与失败重试可恢复。",
      "deliverables": [
        "MQ 学习增强验收记录",
        "可选异步任务"
      ],
      "dependency": "M4 阶段出口",
      "pair": "可选异步任务",
      "optional": true
    }
  ],
  boundaries: [
    {
      "title": "Go 重构范围",
      "text": "Server 负责协议、RPC、持久化和实时事件。"
    },
    {
      "title": "Pi Python Connector",
      "text": "在上游 Python 执行框架中接入 Pi，依赖及差异按版本记录。"
    },
    {
      "title": "直接复用其他执行端",
      "text": "原客户端、DSH 插件及其他上游 Connector 使用配套发行版本。"
    }
  ],
  protocols: [
    {
      "title": "客户端 ↔ Server",
      "tag": "HTTP / WebSocket",
      "paths": [
        "/api/v2/auth/*",
        "/api/v2/oauth/*",
        "/api/v2/connectors",
        "/api/v2/sessions/*",
        "/api/v2/ws-ticket"
      ],
      "text": "兼容原路径、方法、认证、状态码、JSON 形状、分页、文件流和实时事件。Gin 的错误映射遵循原客户端约定。",
      "ids": [
        "B02",
        "S01",
        "S03",
        "S11"
      ]
    },
    {
      "title": "Server ↔ Connector",
      "tag": "AUTH / INGEST / RPC",
      "paths": [
        "/api/v2/connector/auth",
        "/api/v2/connector/ingest",
        "/api/v2/connector/ws"
      ],
      "text": "保留握手、请求与通知信封、request ID、错误、超时及 runtimeType / runtimeId 身份。旧连接的迟到响应不能覆盖新状态。",
      "ids": [
        "S06",
        "S07",
        "P02"
      ]
    },
    {
      "title": "Python Connector ↔ Pi",
      "tag": "ACP STDIO",
      "paths": [
        "PiProvider",
        "AcpRuntime",
        "@openma/pi-acp"
      ],
      "text": "上游承担通用 ACP 交互；Pi 接入按会话报告能力并回传执行事件。",
      "ids": [
        "P01",
        "P03",
        "P04"
      ]
    }
  ],
  failureCases: [
    {
      "title": "重复消息与重复摄取",
      "text": "相同 clientMessageId 和相同同步批次重复到达时，消息、Timeline 条目与 revision 符合基线去重语义。",
      "ids": [
        "S10",
        "P05"
      ]
    },
    {
      "title": "接受数据后再推进检查点",
      "text": "服务端拒收、超时或暂时离线时，不保存覆盖这些数据的同步检查点，重连后可重发与校准。",
      "ids": [
        "P05",
        "S10"
      ]
    },
    {
      "title": "响应丢失与执行结果不明",
      "text": "操作可能已送达 DSH 时，先读取原生状态和回执；修改操作不因网络超时盲目重发。",
      "ids": [
        "S07",
        "P05"
      ]
    },
    {
      "title": "单个坏会话的隔离",
      "text": "一个损坏历史、超大快照或失败会话不阻塞其余会话；已同步历史不会被空快照错误覆盖。",
      "ids": [
        "S10",
        "D08"
      ]
    },
    {
      "title": "重连与迟到响应",
      "text": "旧连接、旧实例和过期租约失效后，迟到响应不覆盖新的连接与 Runtime 状态。",
      "ids": [
        "S07",
        "S19"
      ]
    },
    {
      "title": "双端审批竞争",
      "text": "手机与 Web 同时回应相同审批时，按照 Runtime 当前 notice 和有效能力裁决，过期请求不生效。",
      "ids": [
        "S12",
        "S13"
      ]
    },
    {
      "title": "各进程分别重启",
      "text": "分别重启 Server、Connector、DSH 与 Router，校准后历史、当前状态和检查点一致。",
      "ids": [
        "P05",
        "D05"
      ]
    },
    {
      "title": "容器重建与本机身份",
      "text": "设备凭据、检查点、工作目录持久保存；遗留 PID 或 PID 复用不会造成错误接管。",
      "ids": [
        "D02",
        "D04"
      ]
    },
    {
      "title": "文件与终端授权",
      "text": "校验资源所属用户、路径根目录、符号链接、附件票据和终端权限，防止跨资源访问。",
      "ids": [
        "S16",
        "S17"
      ]
    },
    {
      "title": "慢消费者与积压",
      "text": "限制 RPC 并发、同步积压、日志缓冲和终端输出；压力下仍可诊断并清理资源。",
      "ids": [
        "S07",
        "D08"
      ]
    },
    {
      "title": "真实手机最终验收",
      "text": "记录手机系统、App、DSH、插件、Go 后端和部署版本，实际完成登录、会话、审批、文件与恢复操作。",
      "ids": [
        "B01",
        "D09"
      ]
    }
  ],
  sources: [
    {
      "label": "上游源码快照",
      "url": "https://github.com/anywhere-labs/Agents-Anywhere/tree/98dd0e6e5ddc1c5d1b35e1aaea6b5d00bdfd7008"
    },
    {
      "label": "Server 架构",
      "url": "https://github.com/anywhere-labs/Agents-Anywhere/blob/98dd0e6e5ddc1c5d1b35e1aaea6b5d00bdfd7008/docs/server-architecture.md"
    },
    {
      "label": "DSH Bridge 2.0",
      "url": "https://github.com/anywhere-labs/Agents-Anywhere/blob/98dd0e6e5ddc1c5d1b35e1aaea6b5d00bdfd7008/contracts/dsh-bridge/2.0/README.md"
    },
    {
      "label": "本机记录与启动协议",
      "url": "https://github.com/anywhere-labs/Agents-Anywhere/blob/98dd0e6e5ddc1c5d1b35e1aaea6b5d00bdfd7008/contracts/local-machine/2.0/README.md"
    },
    {
      "label": "Runtime Control 2.1",
      "url": "https://github.com/anywhere-labs/Agents-Anywhere/blob/98dd0e6e5ddc1c5d1b35e1aaea6b5d00bdfd7008/contracts/runtime-control/2.1/README.md"
    },
    {
      "label": "Python ACP 与 Pi 实现",
      "url": "https://github.com/anywhere-labs/Agents-Anywhere/blob/856026d/docs/runtime-protocol/acp-runtime-implementation.md"
    }
  ],
};

await writeFile(new URL('docs/prd/requirements.json', root), JSON.stringify(data, null, 2) + '\n');
console.log(`Synced ${requirements.length} requirements across ${modules.length} modules.`);
