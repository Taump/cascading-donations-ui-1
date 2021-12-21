import { useEffect, useState, memo, createRef } from "react";
import { useInterval, useWindowSize } from "usehooks-ts";
import { Pie } from '@ant-design/charts';
import { useNavigate } from 'react-router-dom';

import { Agent } from "api/agent";
import { IParsedRule, RecipientList } from "components/Recipient/Recipient";
import { getAvatarLink } from "utils";

interface IRecipients {
  fullName: string;
  rules: IParsedRule[]
}

const colors = ["#6295F9", "#F6C02D", "#a0d911", "#1890ff", "#2f54eb", "#722ed1", "#003a8c", "#8c8c8c", "#135200"];

export const Recipients: React.FC<IRecipients> = memo(({ fullName, rules }) => {
  const [recipients, setRecipients] = useState<IParsedRule[]>();

  const { width } = useWindowSize();
  const navigate = useNavigate();
  const chartRef = createRef();
  
  const updateRecipients = () => {
    Agent.getRules(fullName).then(([rules]) => setRecipients(Object.entries(rules).map(([repo, percent]) => ({ repo, percent }))));
  };

  useEffect(() => {
    if (rules) {
      setRecipients(rules);
    }
  }, [fullName]);

  useInterval(updateRecipients, 10 * 60 * 1000)

  const howMuchGetMaintainer = recipients ? recipients.find((rule) => rule.repo === fullName)?.percent || 0 : 0;

  let actual = 0;
  if (recipients) {
    const config = {
      appendPadding: 10,
      data: recipients.map((item: IParsedRule) => ({ ...item, color: "blue" })),
      angleField: 'percent',
      colorField: 'repo',
      pieStyle: (type: IParsedRule) => {
        if (type.repo !== fullName) {
          return ({
            cursor: "pointer",
            stroke: "#ddd",
            lineWidth: 1,
          })
        } else {
          return ({
            stroke: "#ddd",
            lineWidth: 1,
          })
        }
      },
      color: (type: IParsedRule) => {
        if (type.repo === fullName) {
          return "#ddd"
        } else {
          const color = colors[actual];
          actual++;
          return color;
        }
      },
      radius: 0.8,
      key: `pie-${fullName}`,
      renderer: "svg",
      label: {
        type: 'spider',
        content: `{name}
        {percentage}`
      },

      tooltip: {
        customContent: (_: any, items: any) => {
          return (
            <div key="tooltip">
              <ul style={{ paddingLeft: 0, fontSize: 14 }}>
                {items?.map((item: any, index: any) => {
                  const { name, value } = item;
                  const avatarUrl = getAvatarLink(name.split("/")?.[0])
                  return (
                    <li
                      key={`tooltip-${item.name}-${index}`}
                      className="g2-tooltip-list-item"
                      data-index={index}
                      style={{ padding: 3 }}
                    >
                      <span
                        style={{ display: 'inline-flex', flex: 1, justifyContent: 'space-between', alignItems: "center" }}
                      >
                        <img src={avatarUrl} style={{ width: "1em", height: "1em", borderRadius: 5, marginRight: 5 }} alt={name} />
                        <span style={{ marginRight: 4 }}>{name}</span>
                        <span>receives {value}% of donations</span>
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>
          );
        },
      },
      style: {
        userSelect: "none",
        stroke: "#000",
        width: 800
      }
    }

    return <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 600 }}>How the donated funds are distributed</div>
        <div style={{ maxWidth: 700 }}>The maintainer(s) of <b>{fullName} receive {howMuchGetMaintainer}% </b> of the donated funds. The rest is automatically forwarded to other repos that the maintainer(s) want to support:</div>
      </div>
      {/* @ts-ignore */}
      {width > 800 ? <div style={{ width: 800, margin: "0 auto" }}><Pie {...config} legend={false} ref={chartRef} onReady={(plot) => {
        plot.on('element:click', (...args: any) => {
          if (args[0].data?.data) {
            const repo = args[0].data?.data?.repo;
            if (repo) {
              if (fullName !== repo) {
                navigate(`/repo/${repo}`)
              }
            }
          }
        });
      }} />
      </div> : <RecipientList
        data={recipients}
        prefixForKeys={"recipients-" + fullName}
      />}
    </div>
  } else {
    return null
  }
})

export default Recipients;