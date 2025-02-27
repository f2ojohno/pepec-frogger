import { Frog } from 'frog';

export const app = new Frog({
  title: 'PEPEC FROGGER',
  basePath: '/api/frame',
});

app.frame('/', (c) => {
  return c.res({
    image: 'https://pepec-frogger.vercel.app/silver_robot_frog.png',
    intents: [
      { label: 'Play Frogger', action: 'launch_frame', target: 'https://pepec-frogger.vercel.app/game.html' },
    ],
  });
});

export default app;
