# WhatsApp Cashflow Bot - Troubleshooting Guide

**Common issues and solutions**

---

## 🔧 Common Issues

### Issue 1: Bot Not Responding

**Symptoms:**

- Messages sent but no reply
- Commands not working

**Solutions:**

1. **Check Internet Connection**
   - Verify your internet is working
   - Try sending to another contact

2. **Check Bot Status**
   - Send: `/status`
   - If no response, bot may be offline

3. **Wait a Moment**
   - Bot may be processing
   - Wait 30 seconds and try again

4. **Restart WhatsApp**
   - Close and reopen WhatsApp
   - Try command again

**Still not working?**  
Contact admin: +62 XXX-XXXX-XXXX

---

### Issue 2: Command Not Recognized

**Symptoms:**

- Error: "Command not found"
- Bot doesn't understand command

**Solutions:**

1. **Check Spelling**
   - ❌ `/pack` ✅ `/paket`
   - ❌ `/history30` ✅ `/history 30`

2. **Check Format**
   - Commands start with `/`
   - Use spaces between parameters
   - Example: `/paket 1000000 Description`

3. **View Available Commands**
   - Send: `/help`
   - See all available commands

---

### Issue 3: Transaction Not Saved

**Symptoms:**

- Sent transaction but can't find it
- Transaction missing from history

**Solutions:**

1. **Check Transaction ID**
   - Bot sends confirmation with ID
   - Look for: "Transaction ID: TRX-..."

2. **View History**
   - Send: `/history 7`
   - Check last 7 days

3. **Check Status**
   - May be pending approval
   - Send: `/pending`

4. **Try Again**
   - If no confirmation received, try recording again

---

### Issue 4: Cannot Approve Transaction

**Symptoms:**

- Approve command fails
- Error: "Permission denied"

**Solutions:**

1. **Check Your Role**
   - Only Admin/SuperAdmin can approve
   - Send: `/status` to check your role

2. **Check Transaction ID**
   - Verify ID is correct
   - Format: TRX-YYYYMMDD-XXXXXXXX

3. **Transaction Already Processed**
   - May already be approved/rejected
   - Check: `/history`

---

### Issue 5: Export Not Working

**Symptoms:**

- Export command fails
- File not received

**Solutions:**

1. **Wait for Processing**
   - Large exports take time
   - Wait 1-2 minutes

2. **Check File Size**
   - WhatsApp has 100MB limit
   - Try shorter date range

3. **Retry Export**
   - Send: `/export` again

---

### Issue 6: Chart Not Displaying

**Symptoms:**

- Chart command fails
- Image not received

**Solutions:**

1. **Check Date Range**
   - Need minimum 3 days of data
   - Record more transactions first

2. **Wait for Generation**
   - Charts take 10-30 seconds
   - Be patient

3. **Try Dashboard Instead**
   - Send: `/dashboard`
   - Shows text-based summary

---

### Issue 7: Forecast Not Accurate

**Symptoms:**

- Predictions seem wrong
- Numbers don't make sense

**Solutions:**

1. **Need More Data**
   - Forecasts require 30+ days
   - Record more transactions

2. **Check Input Data**
   - Ensure transactions are accurate
   - Fix any errors in history

3. **Understand Limitations**
   - Forecasts are predictions, not guarantees
   - Based on past patterns

---

### Issue 8: Cannot Access Customer Features

**Symptoms:**

- `/balance` not working
- Error: "Customer not found"

**Solutions:**

1. **Check Registration**
   - Must be registered as customer
   - Contact admin to register

2. **Verify Phone Number**
   - Must use registered WhatsApp number
   - Check with admin

---

## 🆘 Emergency Procedures

### If System is Down

1. Document transactions manually
2. Record in notebook/spreadsheet
3. Enter into system when back online
4. Notify admin immediately

### If Data Looks Wrong

1. **Don't delete anything**
2. Take screenshots
3. Note transaction IDs
4. Contact admin immediately
5. Wait for investigation

---

## 📞 Getting Help

### Level 1: Self-Help

1. Check this troubleshooting guide
2. Send `/help` to bot
3. Review user manual

### Level 2: Peer Help

1. Ask team members
2. Check team chat
3. Share screenshots

### Level 3: Admin Support

1. Contact your admin
2. Provide:
   - What you were trying to do
   - Error message (screenshot)
   - Transaction ID (if applicable)
   - When it happened

### Level 4: Technical Support

1. Email: support@company.com
2. Phone: +62 XXX-XXXX-XXXX
3. Provide all info from Level 3

---

## 💡 Prevention Tips

✅ **Record transactions immediately** - Don't wait  
✅ **Double-check amounts** - Prevent errors  
✅ **Use clear descriptions** - Easy to find later  
✅ **Keep confirmation messages** - Proof of recording  
✅ **Back up important data** - Export regularly  
✅ **Update WhatsApp** - Keep app current  
✅ **Stable internet** - Avoid connectivity issues

---

**Document Version:** 1.0  
**Last Updated:** January 2026
