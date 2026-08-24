module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['module-resolver', {
        root: ['./src'],
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
        alias: {
          '@': './src',
          '@components': './src/components',
          '@screens': './src/screens',
          '@services': './src/services',
          '@context': './src/context',
          '@hooks': './src/hooks',
          '@types': './src/types',
          '@utils': './src/utils',
          '@constants': './src/constants',
          '@assets': './src/assets',
          '@navigation': './src/navigation',
        },
      }],
    ],
  };
};