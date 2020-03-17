import cheerio from 'cheerio';
import path from 'path';
import { uniq } from 'lodash';

import { tags, getNameFromURL, types } from './utils';

export const changeLinkInHTML = (html, url) => {
  const $ = cheerio.load(html);
  const resourceDir = getNameFromURL(url, types.resourceDir);

  const { origin } = new URL(url);
  Object.entries(tags).forEach(([key, attribute]) => {
    $(key).each((i, el) => {
      const link = $(el).attr(attribute);
      if (!link) return;

      const preparedUrl = new URL(link, origin);
      if (!origin.includes(preparedUrl.host)) return;

      const newPath = path.join(resourceDir, getNameFromURL(preparedUrl.toString()));
      $(el).attr(attribute, newPath);
    });
  });
  return $.html();
};

export const getLinksFromHTML = (html, url) => {
  const $ = cheerio.load(html);
  const { origin } = new URL(url);
  const links = [];

  Object.entries(tags).forEach(([key, attribute]) => {
    $(key).each((i, el) => {
      const link = $(el).attr(attribute);
      if (!link) return;

      const preparedUrl = new URL(link, origin);
      if (!origin.includes(preparedUrl.host)) return;

      links.push(preparedUrl.toString());
    });
  });
  return uniq(links);
};
