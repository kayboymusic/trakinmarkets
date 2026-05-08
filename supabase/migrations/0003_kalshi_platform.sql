alter table markets drop constraint if exists markets_platform_check;
alter table markets add constraint markets_platform_check
  check (platform in ('polymarket','bayse','kalshi'));
