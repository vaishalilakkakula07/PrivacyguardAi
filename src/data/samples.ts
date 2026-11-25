import type { InputFormat } from '../engine/types.ts';

export interface SampleDataset {
  id: string;
  title: string;
  domain: string;
  format: InputFormat;
  description: string;
  suggestedCustomTerms: string[];
  content: string;
}

export const SAMPLE_DATASETS: SampleDataset[] = [
  {
    id: 'healthcare-csv',
    title: 'Healthcare Patient Intake',
    domain: 'Healthcare · CSV',
    format: 'csv',
    description: 'Fictional outpatient records containing names, emails, phones, Aadhaar, PAN, and portal IP logs.',
    suggestedCustomTerms: ['Apollo Ward 4B', 'Cardiology-Wing'],
    content: `Patient_ID,Patient_Name,Email,Mobile,Aadhaar_No,PAN_No,Login_IP,Clinical_Unit
PT-101,Aarav Kulkarni,aarav.kulkarni@maildemo.in,+91 9848012345,4512 8890 3421,ABCDE1234F,192.168.14.22,Apollo Ward 4B
PT-102,Meera Nair,meera.nair@healthsample.org,9876543210,7823 4410 9981,PQRSX5678K,10.45.102.18,Cardiology-Wing
PT-103,Rohan Deshmukh,rohan.d@sampleclinic.com,+91 9123456789,5534 1122 8765,LMNOP9012Q,172.16.254.9,Apollo Ward 4B
PT-104,Ananya Iyer,ananya.iyer@demohealth.in,9988776655,6190 3344 7712,GHJKL3456M,203.0.113.45,General Medicine`,
  },
  {
    id: 'banking-txt',
    title: 'Banking KYC Escalation Note',
    domain: 'Banking · TXT',
    format: 'text',
    description: 'Fictional customer support transcript with unstructured PII, tax identifiers, and session IPs.',
    suggestedCustomTerms: ['Project Falcon', 'Tier-1 Vault'],
    content: `Customer Support Escalation Log (Fictional Sample)
Ticket Reference: Project Falcon
Customer: Rahul Sharma
Verified Email: rahul.sharma@fictionalbank.in
Registered Mobile: +91 9849054321
KYC Identifiers: Aadhaar 3456 7890 1234 | PAN BNZAA2318J
Session Access IP: 198.51.100.74

Agent Note: Dr. Priya Menon reviewed the compliance exception for Tier-1 Vault.
Alternate contact Kavya Rao can be reached at kavya.rao@demoemail.org or 9000123456.
Secondary audit terminal connected from 192.0.2.140.`,
  },
  {
    id: 'university-csv',
    title: 'Academic Research Cohort',
    domain: 'Education · CSV',
    format: 'csv',
    description: 'Fictional university capstone survey dataset prepared for privacy-safe analytics sharing.',
    suggestedCustomTerms: ['Lab-Block-C'],
    content: `Roll_Code,Student_Name,Campus_Email,Contact_Number,ID_Ref,Lab_Station_IP,Facility
ST-201,Siddharth Verma,siddharth.v@campusdemo.edu,9811223344,8234 5612 9043,10.20.30.41,Lab-Block-C
ST-202,Niharika Joshi,niharika.j@campusdemo.edu,+91 9701122334,4910 2231 6678,10.20.30.88,Lab-Block-C
ST-203,Vikramaditya Rao,vikram.rao@campusdemo.edu,9866554433,7123 8945 1029,10.20.31.15,AI Research Wing`,
  },
];
