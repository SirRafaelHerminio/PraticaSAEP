/**
 * courses.js
 * Lista de Cursos Técnicos do SENAI disponíveis para geração de provas.
 *
 * O conteúdo curricular de cada curso NÃO precisa ser descrito aqui.
 * A IA já possui conhecimento dos PPCs, Itinerários Formativos e
 * competências de cada curso do SENAI — ela usa esse conhecimento
 * automaticamente ao gerar cada prova.
 *
 * Para adicionar um novo curso, basta incluir: id, name, area e icon.
 */

const COURSES = [
  { id: 'automacao_industrial',  name: 'Automação Industrial',               area: 'Tecnologia Industrial',       icon: 'ti-robot'             },
  { id: 'cibersistemas',         name: 'Cibersistemas para Automação',        area: 'Tecnologia Industrial',       icon: 'ti-cpu'               },
  { id: 'desi',                  name: 'DESI',                                area: 'Tecnologia da Informação',    icon: 'ti-device-desktop'    },
  { id: 'edificacoes',           name: 'Edificações',                         area: 'Construção Civil',            icon: 'ti-building'          },
  { id: 'eletromecânica',        name: 'Eletromecânica',                      area: 'Eletroeletrônica',            icon: 'ti-engine'            },
  { id: 'eletronica',            name: 'Eletrônica',                          area: 'Eletroeletrônica',            icon: 'ti-circuit-transistor'},
  { id: 'eletrotecnica',         name: 'Eletrotécnica',                       area: 'Eletroeletrônica',            icon: 'ti-bolt'              },
  { id: 'info_internet',         name: 'Informática para Internet',           area: 'Tecnologia da Informação',    icon: 'ti-world'             },
  { id: 'iot',                   name: 'Internet das Coisas (IoT)',            area: 'Tecnologia da Informação',    icon: 'ti-wifi'              },
  { id: 'logistica',             name: 'Logística',                           area: 'Gestão e Negócios',           icon: 'ti-truck'             },
  { id: 'manut_automotiva',      name: 'Manutenção Automotiva',               area: 'Automotivo',                  icon: 'ti-car'               },
  { id: 'multimidia',            name: 'Multimídia',                          area: 'Design e Comunicação',        icon: 'ti-photo-video'       },
  { id: 'pcp',                   name: 'PCP — Planejamento e Controle da Produção', area: 'Gestão Industrial',    icon: 'ti-chart-gantt'       },
  { id: 'jogos',                 name: 'Programação de Jogos Digitais',       area: 'Tecnologia da Informação',    icon: 'ti-device-gamepad-2',
    context: 'RESTRIÇÃO OBRIGATÓRIA DE TECNOLOGIA: Todas as atividades, entregas e avaliações desta prova DEVEM utilizar exclusivamente a Game Engine Unity (versão LTS mais recente). O projeto pode ser 2D ou 3D — escolha o que for mais adequado à situação-problema criada. NÃO mencione outras engines (Unreal, Godot, GameMaker, etc.). Use a terminologia e os sistemas nativos do Unity: GameObjects, Components, Prefabs, Scenes, o sistema de física (Rigidbody/Collider), Animator/Animation, UI Toolkit ou Canvas, e scripts em C# com MonoBehaviour. Mencione o Unity Editor, a Unity Asset Store quando pertinente, e o processo de Build para a plataforma-alvo (PC Standalone, WebGL ou Android).' },
  { id: 'qualidade',             name: 'Qualidade',                           area: 'Gestão Industrial',           icon: 'ti-certificate'       },
  { id: 'refrigeracao',          name: 'Refrigeração e Climatização',         area: 'Eletroeletrônica',            icon: 'ti-snowflake'         },
  { id: 'seguranca_trabalho',    name: 'Segurança do Trabalho',               area: 'Saúde e Segurança',           icon: 'ti-shield-check'      },
];
