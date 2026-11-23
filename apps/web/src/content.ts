// ALL the words on the Home, Stats and About sections live here.
// Change the text, save, and the page updates. No other file needs to change.

export const content = {
  brand: 'GullyUmpire',

  ticker: ['Dot ball', 'Boundary', 'Wicket', 'Free hit', 'Last over', 'Super over', 'Gully rules'],

  home: {
    title1: 'Every ball',
    title2: 'counts.',
    subtitle:
      'Score your gully match like a pro: runs, overs, wickets and a season hero. Live camera and DRS are coming next.',
    newMatch: 'New match',
    resume: 'Resume',
    stats: 'Season stats',
    features: [
      { title: 'Live scoring', body: 'Runs, extras, wickets and free hits. Undo anything, any time.' },
      { title: 'DRS & LBW', body: 'Replay the moment and check the line. Coming soon.' },
      { title: 'Season hero', body: 'Stats for every player, built from your matches.' },
    ],
  },

  stats: {
    title1: 'Season',
    title2: 'stats',
    subtitle: 'Who is smashing it, who is bowling fire, and who is just here for the chai.',
    heroLabel: 'Season hero',
    heroNote: 'Runs + 25 points for every wicket',
    battersTitle: 'Run machines',
    bowlersTitle: 'Wicket hunters',
    playersTitle: 'Everyone',
    matchesTitle: 'Recent matches',
    emptyTitle: 'No matches yet',
    emptyBody: 'Finish a match and save it. Your stats show up here.',
    emptyButton: 'Start a match',
  },

  // TODO: put YOUR details here
  about: {
    title: 'About me',
    name: 'SATADRU',
    role: 'Gully cricket nerd & app builder',
    body: 'I built GullyUmpire because every gully match ends in an argument about the score. Now the app keeps count, and the arguments are only about who was really out.',
    links: [
      { label: 'GitHub', href: 'https://github.com/' },
      { label: 'Instagram', href: 'https://instagram.com/' },
    ],
  },

  footer: '@2026',
};