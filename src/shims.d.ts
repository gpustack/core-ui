declare module '*.css';
declare module '*.scss';
declare module '*.module.less' {
  const classes: { [key: string]: string };
  export default classes;
}
declare module '*.svg' {
  const content: string;
  export default content;
}
declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.gif';
declare module '*.md';
declare module 'tinycolor2';
