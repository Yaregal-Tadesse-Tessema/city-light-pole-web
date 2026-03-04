import en from './en';

const om = JSON.parse(JSON.stringify(en)) as typeof en;
export default om;
