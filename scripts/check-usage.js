#!/usr/bin/env node

// Purpose: Command-line tool to check access code usage
// Context: Quick way to view current device usage statistics

import fetch from 'node-fetch';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';

async function checkUsage() {
	try {
		console.log('🔍 Checking access code usage...\n');
		
		const response = await fetch(`${BASE_URL}/api/access/admin`);
		const data = await response.json();
		
		if (!data.success) {
			console.error('❌ Error:', data.error);
			process.exit(1);
		}
		
		console.log(`📊 Access Code Usage Statistics`);
		console.log(`🕐 Last Updated: ${new Date(data.timestamp).toLocaleString()}\n`);
		
		data.codes.forEach(code => {
			const usageBar = '█'.repeat(Math.floor(code.usagePercentage / 10)) + 
							'░'.repeat(10 - Math.floor(code.usagePercentage / 10));
			
			console.log(`📝 ${code.code}`);
			console.log(`   Description: ${code.description || 'No description'}`);
			console.log(`   Usage: ${code.currentDevices}/${code.maxDevices} (${code.usagePercentage}%)`);
			console.log(`   Available: ${code.availableSlots} slots`);
			console.log(`   Progress: [${usageBar}] ${code.usagePercentage}%`);
			
			if (code.activeDevices.length > 0) {
				console.log(`   Active Devices:`);
				code.activeDevices.forEach(device => {
					const expires = new Date(device.expiresAt);
					const now = new Date();
					const timeLeft = Math.max(0, expires.getTime() - now.getTime());
					const hours = Math.floor(timeLeft / (1000 * 60 * 60));
					const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
					
					console.log(`     • ${device.deviceId} (expires in ${hours}h ${minutes}m)`);
				});
			}
			console.log('');
		});
		
	} catch (error) {
		console.error('❌ Failed to fetch usage statistics:', error.message);
		console.log('\n💡 Make sure the development server is running:');
		console.log('   npm run dev');
		process.exit(1);
	}
}

checkUsage();
