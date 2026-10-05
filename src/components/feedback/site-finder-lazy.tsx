"use client";

import dynamic from "next/dynamic";

export const SiteFinderLazy = dynamic(() => import("./site-finder").then((m) => m.SiteFinder));
