function main(config) {
  const originalProxyGroups = config?.['proxy-groups'] || [];
  config['proxy-groups'] = originalProxyGroups.map((group) => {
    if (!group.filter && !group.name.includes('全球直连')) {
      group.proxies = (group?.proxies ?? []).concat(config.proxies.map((proxy) => proxy.name));
    }
    return group;
  });
  return config;
}
