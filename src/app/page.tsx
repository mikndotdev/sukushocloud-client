"use client";
import { invoke } from '@tauri-apps/api/core';
import { load } from '@tauri-apps/plugin-store';
import { enable, isEnabled, disable } from '@tauri-apps/plugin-autostart';
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';
import { useState, useEffect } from "react";
import crypto from "crypto";

import { AiOutlineLoading3Quarters } from "react-icons/ai";

const enableAutostart = async () => {
    await enable();
    console.log('Autostart enabled');
}

const disableAutostart = async () => {
    await disable();
    console.log('Autostart disabled');
}

const sendTestNotification = async () => {
    if (await isPermissionGranted()) {
        await sendNotification({
            title: 'Hello, world!',
            body: 'This is a test notification.'
        });
    } else {
        await requestPermission();
    }
}

export default function Home() {
    const [loading, setLoading] = useState(true);
    const [loggedIn, setLoggedIn] = useState(false);
    const[authKey, setAuthKey] = useState('');

    const setVars = async () => {
        const store = await load('settings.json', { autoSave: false });

        const apiKey = await store.get<{ value: string }>('apiKey');

        if (apiKey?.value) {
            console.log(apiKey.value);
            setLoggedIn(true);
        } else {
            setLoggedIn(false);
        }
        setLoading(false);
    }

    const login = async () => {
        await setAuthKey(crypto.randomBytes(16).toString('hex'));
        await invoke('open_url', { url: `https://auth.sukusho.cloud/${authKey}` });
    }

    useEffect(() => {
        enableAutostart();
        setVars();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <AiOutlineLoading3Quarters className="animate-spin text-white" size={32}/>
            </div>
        );
    }

    if (!loggedIn) {
        return (
            <div className="flex flex-col space-y-4 items-center justify-center h-screen">
                <h1 className="text-2xl font-bold text-white">Log in to sukushocloud</h1>
                <button className="px-4 py-2 bg-primary text-white rounded-lg" onClick={() => login()}>Log in</button>
            </div>
        );
    }

    return (
        <div className="">
            <h1 className="text-4xl font-bold text-white">Hello, world!</h1>
        </div>
    );
}
