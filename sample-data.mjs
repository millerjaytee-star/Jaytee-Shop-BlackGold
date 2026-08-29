export const sampleEvents = [{
  id:'demo-ravens-bills', sport_title:'NFL', commence_time:new Date(Date.now()+5*3600000).toISOString(),
  home_team:'Buffalo Bills', away_team:'Baltimore Ravens',
  bookmakers:[
    {key:'alpha',title:'Book Alpha',last_update:new Date().toISOString(),markets:[
      {key:'h2h',outcomes:[{name:'Baltimore Ravens',price:135},{name:'Buffalo Bills',price:-155}]},
      {key:'spreads',outcomes:[{name:'Baltimore Ravens',price:-108,point:3.5},{name:'Buffalo Bills',price:-112,point:-3.5}]},
      {key:'totals',outcomes:[{name:'Over',price:-110,point:48.5},{name:'Under',price:-110,point:48.5}]}
    ]},
    {key:'beta',title:'Book Beta',last_update:new Date(Date.now()-2*60000).toISOString(),markets:[
      {key:'h2h',outcomes:[{name:'Baltimore Ravens',price:145},{name:'Buffalo Bills',price:-165}]},
      {key:'spreads',outcomes:[{name:'Baltimore Ravens',price:-105,point:3.5},{name:'Buffalo Bills',price:-115,point:-3.5}]},
      {key:'totals',outcomes:[{name:'Over',price:-105,point:48.5},{name:'Under',price:-115,point:48.5}]}
    ]},
    {key:'gamma',title:'Book Gamma',last_update:new Date(Date.now()-6*60000).toISOString(),markets:[
      {key:'h2h',outcomes:[{name:'Baltimore Ravens',price:138},{name:'Buffalo Bills',price:-160}]},
      {key:'spreads',outcomes:[{name:'Baltimore Ravens',price:100,point:3.5},{name:'Buffalo Bills',price:-120,point:-3.5}]},
      {key:'totals',outcomes:[{name:'Over',price:-108,point:48.5},{name:'Under',price:-112,point:48.5}]}
    ]}
  ]
}];
