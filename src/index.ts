import "reflect-metadata"
import {
  createConnection,
  getConnection,
  createQueryBuilder,
  getRepository
} from "typeorm"
import * as voca from "voca"

import { commissions_data } from "./entity/CommissionData"

var totalGPOnSO = 0
var totalRevOnSO = 0
var totalGP = 0
var totalRev = 0

const getUniqueSO = myArray => {
  var uniqueArray = [],
    temp = []

  const distinct = (value, index, self) => {
    return self.indexOf(value) === index
  }

  for (var i = 0; i < myArray.length; i++) {
    temp[i] = myArray[i].so
    // console.log(temp[i])
  }

  uniqueArray = temp.filter(distinct)
  return uniqueArray
}

const getUniqueInvoices = myArray => {
  var uniqueArray = [],
    temp = []

  //   console.log("IN getUnique ", myArray)

  const distinct = (value, index, self) => {
    return self.indexOf(value) === index
  }

  for (var i = 0; i < myArray.length; i++) {
    temp[i] = myArray[i].invoice
    // console.log(temp[i])
  }

  uniqueArray = temp.filter(distinct)
  return uniqueArray
}

createConnection()
  .then(async connection => {
    //Intro info...
    console.log(voca.repeat("*", 80))
    console.log("*", voca.pad("Commissions Review", 76), "*")
    console.log("*", voca.pad("Version 1.0", 76), "*")
    console.log(voca.repeat("*", 80))

    //Load Data from DB to scan for unique sales orders.
    console.log(voca.repeat("*", 80))
    console.log("*", voca.pad("Loading Data from Database", 76), "*")
    console.log(voca.repeat("*", 80))

    const rows = await connection.manager.find(commissions_data)
    console.log("Loaded ", rows.length, " rows of sales orders.")

    const salesOrders = await getRepository(commissions_data)
      .createQueryBuilder()
      .select("comm.so")
      .from(commissions_data, "comm")
      .where("comm.customer = :customer", { customer: "NEWYO044" })
      .getMany()
    // console.log(salesOrders)
    const uniqueSalesOrders = getUniqueSO(salesOrders)

    console.log(
      "Identified ",
      uniqueSalesOrders.length,
      " unique sales orders... for customer NEWYO044\n\n"
    )

    //find the corresponding invoices associated with each sales order and display them with totals

    // for each SO
    //    identify all of the unique invoices
    //    sum the invoices and print the SO with invoice total (keep an SO total)
    console.log(voca.repeat("*", 80))
    console.log("*", voca.pad("Invoice Data", 76), "*")
    console.log(voca.repeat("*", 80))

    //id unique invoices
    for (var i = 0; i < uniqueSalesOrders.length; i++) {
      console.log(voca.repeat("-", 80))
      //for each invoice unique to that SO
      // const invoices = findInvoices(uniqueSalesOrders[i])
      const invoices = await getRepository(commissions_data)
        .createQueryBuilder()
        .select("comm.invoice")
        .from(commissions_data, "comm")
        .where("comm.so = :so", { so: `${uniqueSalesOrders[i]}` })
        .getMany()

      //   console.log(invoices)
      const uniqueInvoices = getUniqueInvoices(invoices)
      //   console.log(uniqueInvoices)
      console.log(
        voca.padRight("Sales Order# " + uniqueSalesOrders[i], 30),
        voca.padRight("Unique Invoices: " + uniqueInvoices.length, 24),
        voca.padLeft("Total Invoice Lines: " + invoices.length, 24)
      )
      console.log(voca.repeat("-", 80))

      console.log(
        voca.padRight("Invoice", 30),
        voca.padRight("Revenue", 24),
        voca.padLeft("Gross Profit", 24)
      )
      console.log(voca.repeat("-", 80))

      for (var x = 0; x < uniqueInvoices.length; x++) {
        //Go get each invoice of this number from DB and total the valuesa

        // console.log("loop: ", x)
        const gp = await getRepository(commissions_data)
          .createQueryBuilder()
          .select("comm.gp")
          .from(commissions_data, "comm")
          .where("comm.invoice = :invoice", { invoice: `${uniqueInvoices[x]}` })
          .getMany()

        //Total it up by hand
        var invoiceGPTotal = 0
        var invoiceRevTotal = 0

        for (var count = 0; count < gp.length; count++) {
          //   console.log(count, Number(gp[count].gp))
          invoiceGPTotal = invoiceGPTotal + Number(gp[count].gp)
        }

        // console.log("DEBUG -> ", invoiceGPTotal)

        const rev = await getRepository(commissions_data)
          .createQueryBuilder()
          .select("comm.revenue")
          .from(commissions_data, "comm")
          .where("comm.invoice = :invoice", { invoice: `${uniqueInvoices[x]}` })
          .getMany()

        for (var count = 0; count < rev.length; count++) {
          //   console.log(count, Number(rev[count].revenue))
          invoiceRevTotal = invoiceRevTotal + Number(rev[count].revenue)
        }

        // console.log("DEBUG -> ", rev.revenue)
        totalGPOnSO = totalGPOnSO + invoiceGPTotal
        totalRevOnSO = totalRevOnSO + invoiceRevTotal
        totalGP = totalGP + invoiceGPTotal
        totalRev = totalRev + invoiceRevTotal

        console.log(
          voca.padRight(uniqueInvoices[x], 30),
          voca.padRight("$" + invoiceRevTotal.toLocaleString("en"), 24),
          voca.padLeft("$" + invoiceGPTotal.toLocaleString("en"), 24)
        )
      }
      console.log(voca.repeat("-", 80))
      console.log(
        voca.padRight("TOTAL", 31) +
          voca.padRight("$" + totalRevOnSO.toLocaleString("en"), 24) +
          voca.padLeft("$" + totalGPOnSO.toLocaleString("en"), 25)
      )
      console.log("\n\n")

      totalRevOnSO = 0
      totalGPOnSO = 0
    }

    console.log(voca.repeat("-", 80))
    console.log("Total Revenue: $" + totalRev.toLocaleString("en"))
    console.log("Total GP: $" + totalGP.toLocaleString("en"))
    console.log(voca.repeat("-", 80))
    console.log("\n\n")
  })
  .catch(error => console.log(error))
