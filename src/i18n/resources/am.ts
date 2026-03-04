import en from './en';

const am = JSON.parse(JSON.stringify(en)) as typeof en;
export default am;
