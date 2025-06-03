const crypto = require('crypto');
const fs = require('fs');

 
const privateKey =  "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCunsS7vGOvDxrr\nNTzxPRN1hj33cXUK7AsTGtXqye07vOyv+lgol1nhBRc+qAw3kXruOTKPHI2OOx8W\nIhazzRdo7wJISh5dHS6UwxVgYA6BLY5p8g+xTELdyMeETX3v5R5FlbVZySJdTOGp\nyJD8t0y5Qm3DpmXoEL5REwyQ8ck8p+CocNMYUF3S/Y0LD+DYize0IE1GosCAFNd7\nPc2lbcQiyylmg53pmMcKO9KvlVUn8kyKcRtOHkE6D24QxKmObQSb7ueNbJ8pDehJ\nzR6GnpiZNFHhOayQ8XJuWEY0iVMz9MnvUuq+DGA4MBfjHTvnRxvcIh8c2/TuD2BP\nwqLh2vszAgMBAAECggEAH/Rr+hMChvGTsoE+ksLjgbk8M8Ducz441JkvllS3dhwf\nkCCW626vAu+kjlHAUpbr0RZkey31dZa6HJnGX8bjRs+eMk5l+hIyCQUeL1HEtbz5\nd8fVOVPEVMO+RybLKhBals9LrY+SG1LLZP+QEL8WajyOy6PyuCIAQePjg87LTa75\nSuYyZOuH/SQH92dTU56v9rc5GIocOT0vuwHYCPbRfM6+KQWpBq5aNXg0JpCikADh\nqbv2YfcNY/7xthso/TcGni2OM+rwQiyypSTmEH+GR4g2KUWpBwpl7XOUMJFLaTeE\nWeeshie+EXIeNpR5YH5as7gtPle8u0+nKnswLB1aKQKBgQDnR1BEHvQoPwwxrM6B\nLBRDZOqH0Rl/39TGZCc5z6lLEIMSh40Jz2I2LFzgrjFH++SmEbsAHTgVgcqq+doU\nTsfswHkxGo1SV0E6WEkXcRfFNSQGOp8mS/0fBekrnMp5LmjLqMoEWuv8+/TqTQ1p\nXSVBtpKXHfjFi7cVtBRtuprF/wKBgQDBSQ9ebmaV1UKum4L0J/iYnuPOum+ZkQAo\neyUc8W9LKiQqQghmtsbCTqyvIk+DmzD8E4pS0dZILDY14tXara6d8neE2jRGHVJk\nsCSxZMVfpx8jKzqRnD/j/HTKHbOJ8VV8P9TnM7Y686bKGZRx2Adbm3o1JD4zsens\nbXsMlwGSzQKBgAHd6H70RQJCKAYKoAwY3/z/RolcHbmTg/MqAcsMqxApDPXMVE4c\n92z6hLFnlow/M0RH5luE4NwDlTA2HhWF4UU+9Ht5/GQKwkMHTWe8CPYVjLnkJT64\n5E0ozg4FEPlTb5MdRKwuU7NSEVMG1jHgh5l1MM+5dTWbABpTvsp39CHfAoGAXL1G\nX4PPOvMRRKAfLDEFiY0rNuSjaWZ2UfYML5/0S3dT1ObMCySFp3OCTaHDzxymWzyw\n8N3317dG54IIJB2Tm/tbt2XPERk+kEsnv+ne/e889G3oczcqPKTEELpBi908rBog\neDKKrCx+CZhObnU9yomGEHtsUPd7itJY6QiHW70CgYALT4eTrKppsc3RwgYFrtke\nbdMysfN3baad9yuX+iVKcH4sRz5L139ncMeKQulrf3fTO5upsTW0QNCBBGTVU9MB\nxsm1DszmJ34wvSY+HwBt6VRMPC3INyOVnar2pcDsr6ObHXaCr6tYvkpgtNXckTbj\nNrhUiCaL6hwTfuPsYHLyPw==\n-----END PRIVATE KEY-----\n"

// Example transaction data
const sender = "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEArp7Eu7xjrw8a6zU88T0T\ndYY993F1CuwLExrV6sntO7zsr/pYKJdZ4QUXPqgMN5F67jkyjxyNjjsfFiIWs80X\naO8CSEoeXR0ulMMVYGAOgS2OafIPsUxC3cjHhE197+UeRZW1WckiXUzhqciQ/LdM\nuUJtw6Zl6BC+URMMkPHJPKfgqHDTGFBd0v2NCw/g2Is3tCBNRqLAgBTXez3NpW3E\nIsspZoOd6ZjHCjvSr5VVJ/JMinEbTh5BOg9uEMSpjm0Em+7njWyfKQ3oSc0ehp6Y\nmTRR4TmskPFyblhGNIlTM/TJ71LqvgxgODAX4x0750cb3CIfHNv07g9gT8Ki4dr7\nMwIDAQAB\n-----END PUBLIC KEY-----\n"
const receiver = "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAklz0YbHV9SiBNsqsMR42\nvID8odPgkyreD6IYW/Z7xOJXyqilmos5+MDaBO6ncU+JKOJLljHydo1S8R8CmOfW\nnY8+EeaRz0w9MFZDmkHMnXe9Z8+8oHYSMimeaLa9gvuSd+jNaxG67WiAgO+VAQkM\nt6lM8GgXMHqY1DkuNcOTjeyXkBeHmF7oR3XcLccp9BPXBij3nca3J3btQSXODDT3\nAzsrMMMYeeQ6P3cF3FZamhdgxcukWNT+ZECPG4OciQf0cGfsJwQGLM67sDR6m8iF\n4M7g5W0aFdxkSnlu5WorLv9xImstgsgVDCyqS+PmS2htttMOOWVSbNZH6VBNOnxG\nzwIDAQAB\n-----END PUBLIC KEY-----\n";
const amount = 52;
const fees = 2;

// Message to sign (should match server verification structure)
const message = sender + receiver + amount + fees;

// Create a signer
const sign = crypto.createSign('SHA256');
sign.update(message);
sign.end();

// Sign the message
const signature = sign.sign(privateKey, 'hex');

// Build transaction
const transaction = {
    sender,
    receiver,
    amount,
    fees,
    signature,
};

console.log("Signed Transaction:", transaction);

// Optionally send it to the server here
