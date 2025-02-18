import { writable } from 'svelte/store';
import { browser } from '$app/environment';

type TopicsStore = {
    selected: Set<string>;
    custom: string[];
    expanded: Set<string>;
}

const createTopicsStore = () => {
    // Initialize with stored values or defaults
    const initial: TopicsStore = {
        selected: new Set(),
        custom: [],
        expanded: new Set()
    };

    if (browser) {
        const storedSelected = localStorage.getItem('selectedTopics');
        const storedCustom = localStorage.getItem('customTopics');

        if (storedSelected) initial.selected = new Set(JSON.parse(storedSelected));
        if (storedCustom) initial.custom = JSON.parse(storedCustom);
    }

    const { subscribe, set, update } = writable<TopicsStore>(initial);

    return {
        subscribe,
        toggleTopic: (topic: string) => update(store => {
            const selected = new Set(store.selected);
            if (selected.has(topic)) {
                selected.delete(topic);
            } else {
                selected.add(topic);
            }
            if (browser) {
                localStorage.setItem('selectedTopics', JSON.stringify([...selected]));
            }
            return { ...store, selected };
        }),
        toggleExpanded: (topic: string) => update(store => {
            const expanded = new Set(store.expanded);
            if (expanded.has(topic)) {
                expanded.delete(topic);
            } else {
                expanded.add(topic);
            }
            return { ...store, expanded };
        }),
        addCustomTopic: (topic: string) => update(store => {
            const custom = [...store.custom, topic];
            if (browser) {
                localStorage.setItem('customTopics', JSON.stringify(custom));
            }
            return { ...store, custom };
        }),
        removeCustomTopic: (topic: string) => update(store => {
            const custom = store.custom.filter(t => t !== topic);
            if (browser) {
                localStorage.setItem('customTopics', JSON.stringify(custom));
            }
            return { ...store, custom };
        })
    };
};

export const topicsStore = createTopicsStore();