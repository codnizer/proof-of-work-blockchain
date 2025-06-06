const crypto = require('crypto');

// Wrap base64 key with PEM format
function wrapKey(base64Key, type = 'private') {
  const header = type === 'private' ? '-----BEGIN PRIVATE KEY-----' : '-----BEGIN PUBLIC KEY-----';
  const footer = type === 'private' ? '-----END PRIVATE KEY-----' : '-----END PUBLIC KEY-----';
  const formatted = base64Key.match(/.{1,64}/g).join('\n');
  return `${header}\n${formatted}\n${footer}`;
}

// Public and private keys (base64 format)
// REPLACE THESE WITH YOUR OWN KEYS
const publicKeyBase64 = "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEArp7Eu7xjrw8a6zU88T0TdYY993F1CuwLExrV6sntO7zsr/pYKJdZ4QUXPqgMN5F67jkyjxyNjjsfFiIWs80XaO8CSEoeXR0ulMMVYGAOgS2OafIPsUxC3cjHhE197+UeRZW1WckiXUzhqciQ/LdMuUJtw6Zl6BC+URMMkPHJPKfgqHDTGFBd0v2NCw/g2Is3tCBNRqLAgBTXez3NpW3EIsspZoOd6ZjHCjvSr5VVJ/JMinEbTh5BOg9uEMSpjm0Em+7njWyfKQ3oSc0ehp6YmTRR4TmskPFyblhGNIlTM/TJ71LqvgxgODAX4x0750cb3CIfHNv07g9gT8Ki4dr7MwIDAQAB";
const privateKeyBase64 = "MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCunsS7vGOvDxrrNTzxPRN1hj33cXUK7AsTGtXqye07vOyv+lgol1nhBRc+qAw3kXruOTKPHI2OOx8WIhazzRdo7wJISh5dHS6UwxVgYA6BLY5p8g+xTELdyMeETX3v5R5FlbVZySJdTOGpyJD8t0y5Qm3DpmXoEL5REwyQ8ck8p+CocNMYUF3S/Y0LD+DYize0IE1GosCAFNd7Pc2lbcQiyylmg53pmMcKO9KvlVUn8kyKcRtOHkE6D24QxKmObQSb7ueNbJ8pDehJzR6GnpiZNFHhOayQ8XJuWEY0iVMz9MnvUuq+DGA4MBfjHTvnRxvcIh8c2/TuD2BPwqLh2vszAgMBAAECggEAH/Rr+hMChvGTsoE+ksLjgbk8M8Ducz441JkvllS3dhwfkCCW626vAu+kjlHAUpbr0RZkey31dZa6HJnGX8bjRs+eMk5l+hIyCQUeL1HEtbz5d8fVOVPEVMO+RybLKhBals9LrY+SG1LLZP+QEL8WajyOy6PyuCIAQePjg87LTa75SuYyZOuH/SQH92dTU56v9rc5GIocOT0vuwHYCPbRfM6+KQWpBq5aNXg0JpCikADhqbv2YfcNY/7xthso/TcGni2OM+rwQiyypSTmEH+GR4g2KUWpBwpl7XOUMJFLaTeEWeeshie+EXIeNpR5YH5as7gtPle8u0+nKnswLB1aKQKBgQDnR1BEHvQoPwwxrM6BLBRDZOqH0Rl/39TGZCc5z6lLEIMSh40Jz2I2LFzgrjFH++SmEbsAHTgVgcqq+doUTsfswHkxGo1SV0E6WEkXcRfFNSQGOp8mS/0fBekrnMp5LmjLqMoEWuv8+/TqTQ1pXSVBtpKXHfjFi7cVtBRtuprF/wKBgQDBSQ9ebmaV1UKum4L0J/iYnuPOum+ZkQAoeyUc8W9LKiQqQghmtsbCTqyvIk+DmzD8E4pS0dZILDY14tXara6d8neE2jRGHVJksCSxZMVfpx8jKzqRnD/j/HTKHbOJ8VV8P9TnM7Y686bKGZRx2Adbm3o1JD4zsensbXsMlwGSzQKBgAHd6H70RQJCKAYKoAwY3/z/RolcHbmTg/MqAcsMqxApDPXMVE4c92z6hLFnlow/M0RH5luE4NwDlTA2HhWF4UU+9Ht5/GQKwkMHTWe8CPYVjLnkJT645E0ozg4FEPlTb5MdRKwuU7NSEVMG1jHgh5l1MM+5dTWbABpTvsp39CHfAoGAXL1GX4PPOvMRRKAfLDEFiY0rNuSjaWZ2UfYML5/0S3dT1ObMCySFp3OCTaHDzxymWzyw8N3317dG54IIJB2Tm/tbt2XPERk+kEsnv+ne/e889G3oczcqPKTEELpBi908rBogeDKKrCx+CZhObnU9yomGEHtsUPd7itJY6QiHW70CgYALT4eTrKppsc3RwgYFrtkebdMysfN3baad9yuX+iVKcH4sRz5L139ncMeKQulrf3fTO5upsTW0QNCBBGTVU9MBxsm1DszmJ34wvSY+HwBt6VRMPC3INyOVnar2pcDsr6ObHXaCr6tYvkpgtNXckTbjNrhUiCaL6hwTfuPsYHLyPw==";

// PEM-wrapped keys
const publicKeyPem = wrapKey(publicKeyBase64, 'public');
const privateKeyPem = wrapKey(privateKeyBase64, 'private');

// Get transaction details from command line arguments
const [receiverBase64, amount, fees] = process.argv.slice(2);

if (!receiverBase64 || !amount || !fees) {
  console.error("Usage: node sign-transaction.js   ");
  process.exit(1);
}

// Wrap receiver's public key
const receiverPem = wrapKey(receiverBase64, 'public');

// Create message to sign
const message = publicKeyBase64 + receiverBase64 + amount + fees;

// Sign transaction
const sign = crypto.createSign('SHA256');
sign.update(message);
sign.end();

const signature = sign.sign(privateKeyPem, 'hex');

// Output transaction details
console.log("✅ Transaction signed successfully");
console.log("🔏 Signature:", signature);
console.log("\n📋 Copy this signature to the transaction form:");

// Construct transaction object
const transaction = {
  sender: publicKeyPem,
  receiver: receiverPem,
  amount: Number(amount),
  fees: Number(fees),
  signature,
};

console.log(JSON.stringify(transaction, null, 2));