"use client";

import { useState } from "react";
import Header from "../../components/Header";
import {
  ShoppingCart,
  Package,
  Warehouse,
  ReceiptText,
  ShoppingBag,
  Truck,
  Users,
  UserGroup,
  UserCheck,
  RotateCcw,
  Wallet,
  FileText,
  Banknote,
  BarChart3,
  Settings,
  Shield,
  Database,
  FileSpreadsheet,
  ChevronDown,
  ChevronLeft,
  Search,
  HelpCircle,
  BookOpen,
  Layers,
  ClipboardList,
  CreditCard,
  QrCode,
  Palette,
} from "lucide-react";

type Section = {
  id: string;
  title: string;
  icon: React.ElementType;
  color: string;
  items: {
    title: string;
    description: string;
    steps?: string[];
    tips?: string[];
  }[];
};

const sections: Section[] = [
  {
    id: "getting-started",
    title: "البداية السريعة",
    icon: BookOpen,
    color: "from-primary-500 to-primary-700",
    items: [
      {
        title: "تسجيل الدخول",
        description: "أول ما تفتح البرنامج، هتظهرلك شاشة تسجيل الدخول. ادخل بالبريد الإلكتروني وكلمة المرور اللي اتعملوا لك.",
        steps: [
          "اكتب البريد الإلكتروني",
          "اكتب كلمة المرور",
          "اضغط 'دخول'",
        ],
        tips: [
          "لو نسيت كلمة المرور، كلّم المدير",
          "الأدمن عنده صلاحيات كاملة، المستخدم العادي عنده صلاحيات محدودة",
        ],
      },
      {
        title: "التنقل في البرنامج",
        description: "البرنامج فيه قائمة جانبية (Sidebar) فيها كل الأقسام. اضغط على أيقونة القائمة (☰) في الهيدر عشان تفتحها.",
        tips: [
          "الأقسام اللي مش من صلاحياتك مش هتظهر في القائمة",
          "استخدم بحث Ctrl+K للوصول السريع لأي صفحة",
        ],
      },
      {
        title: "تغيير الثيم",
        description: "البرنامج فيه 7 ثيمات مختلفة. اضغط على أيقونة 🎨 في الهيدر عشان تغيّر الثيم.",
        tips: [
          "الثيم بيتحفظ تلقائيًا، هيفضل زي ما اخترته بعد إغلاق البرنامج",
          "الثيمات: وردي، ليلي، محيط، غابة، غروب، ملكي، ليلي محيط",
        ],
      },
    ],
  },
  {
    id: "pos",
    title: "الكاشير (نقطة البيع)",
    icon: ShoppingCart,
    color: "from-success-500 to-success-700",
    items: [
      {
        title: "إضافة منتج للسلة",
        description: "من صفحة الكاشير، تقدر تضيف منتج للسلة بطريقتين: البحث أو مسح الباركود.",
        steps: [
          "اكتب اسم المنتج في مربع البحث، أو امسح الباركود بالجهاز",
          "اضغط على كارت المنتج عشان تضيفه للسلة",
          "لو المنتج ليه أكتر من وحدة (قطعة/علبة)، اختار الوحدة من القائمة المنسدلة",
        ],
        tips: [
          "السعر بيتغير تلقائيًا حسب الوحدة المختارة",
          "الكمية المتاحة بتظهر تحت اسم المنتج",
        ],
      },
      {
        title: "تعديل الكمية والسعر",
        description: "في السلة، تقدر تعدل كمية أي منتج أو سعره.",
        steps: [
          "استخدم أزرار +/- لتعديل الكمية",
          "أو اكتب الكمية مباشرة في المربع",
          "السعر: اكتب السعر الجديد في مربع السعر",
        ],
        tips: [
          "الحد الأقصى للكمية = المخزون المتاح",
          "ممكن تعدل السعر لو عايز تعمل خصم على منتج معين",
        ],
      },
      {
        title: "إضافة عميل",
        description: "لو عايز تسجل الفاتورة باسم عميل، ابحث عنه أو ضيف عميل جديد.",
        steps: [
          "اضغط 'عميل جديد' لإضافة عميل",
          "أو ابحث بالاسم/التليفون واختار العميل",
        ],
      },
      {
        title: "تعليق واسترجاع الفواتير",
        description: "لو عايز تعلّق فاتورة وتكملها بعدين.",
        steps: [
          "اضغط 'تعليق' عشان تحفظ الفاتورة",
          "لما ترجع، اضغط 'استرجاع' عشان ترجع الفاتورة",
        ],
        tips: ["الفواتير المعلقة بتتحفظ في المتصفح، مش في قاعدة البيانات"],
      },
      {
        title: "إتمام البيع",
        description: "لما تخلص، اضغط 'دفع' عشان تحفظ الفاتورة.",
        steps: [
          "تأكد من الكميات والأسعار",
          "اختار طريقة الدفع (كاش/فيزا)",
          "اضغط 'دفع'",
          "لو autoPrintInvoice مفعّل، صفحة الطباعة هتفتح تلقائيًا",
        ],
        tips: [
          "المخزون بيتخصم تلقائيًا",
          "لو اخترت خزنة، رصيدها بيزيد",
          "الفاتورة بتتحفظ في سجل الفواتير",
        ],
      },
    ],
  },
  {
    id: "products",
    title: "المنتجات",
    icon: Package,
    color: "from-info-500 to-info-700",
    items: [
      {
        title: "إضافة منتج",
        description: "من صفحة المنتجات، اضغط 'إضافة منتج جديد'.",
        steps: [
          "اكتب اسم المنتج والباركود",
          "اختار القسم والوحدة الأساسية",
          "حدد سعر الشراء (التكلفة) وسعر البيع",
          "حدد الكمية الابتدائية وحد التنبيه",
          "ضيف وحدات إضافية لو المنتج ليه أكتر من وحدة (علبة/كرتونة)",
          "حدد كميات المخازن لو عندك أكتر من مخزن",
          "اضغط 'حفظ المنتج'",
        ],
        tips: [
          "الوحدة الأساسية هي أصغر وحدة (قطعة)",
          "معامل التحويل: عدد القطع في الوحدة (مثلاً علبة = 12 قطعة)",
          "حد التنبيه: لو الكمية وصلت للرقم ده، بيظهر تحذير",
        ],
      },
      {
        title: "الوحدات المتعددة",
        description: "لو المنتج بيتباع بوحدات مختلفة (قطعة/علبة/كرتونة).",
        steps: [
          "في قسم 'وحدات البيع المتعددة'، اضغط 'إضافة وحدة'",
          "اكتب اسم الوحدة (مثلاً: علبة)",
          "حدد المعامل (مثلاً: 12 لو العلبة فيها 12 قطعة)",
          "حدد سعر البيع للوحدة دي",
          "حدد الوحدة الأساسية (اللي معاملها 1)",
        ],
        tips: ["ممكن تحدد باركود مختلف لكل وحدة"],
      },
      {
        title: "طباعة الباركود",
        description: "من صفحة المنتجات، اضغط أيقونة QR في عمود الإجراءات.",
        steps: [
          "اختار نوع الكود: Barcode (للكاشير) أو QR Code (للموبايل)",
          "لو Barcode: اختار النوع (CODE128 / EAN13 / UPC)",
          "حدد عدد النسخ",
          "اختار إظهار/إخفاء: اسم المتجر، اسم المنتج، السعر",
          "اضغط 'طباعة'",
        ],
        tips: [
          "Barcode يقراه قارئ الباركود العادي في الكاشير",
          "QR Code يقراه الموبايل",
          "CODE128 هو الأضمن (بيقبل أي نص/أرقام)",
        ],
      },
    ],
  },
  {
    id: "warehouses",
    title: "المخازن",
    icon: Warehouse,
    color: "from-orange-500 to-orange-700",
    items: [
      {
        title: "إدارة المخازن",
        description: "من صفحة المخازن، تقدر تضيف/تعدل/تحذف مخازن.",
        steps: [
          "اضغط 'إضافة مخزن'",
          "اكتب اسم المخزن واختار الفرع",
          "اضغط 'حفظ'",
        ],
      },
      {
        title: "جرد المخازن",
        description: "عرض أرصدة المنتجات في كل مخزن.",
        steps: [
          "اختار المخزن (أو كل المخازن)",
          "ابحث بالباركود لو عايز منتج معين",
          "شوف الأرصدة والقيم",
        ],
        tips: [
          "الإحصائيات تحت: إجمالي الكمية، قيمة الشراء، قيمة البيع، الربح المتوقع",
        ],
      },
      {
        title: "تحويل بين المخازن",
        description: "نقل منتجات من مخزن لمخزن تاني.",
        steps: [
          "اختار المخزن المصدر",
          "اختار المخزن المستقبل",
          "اختار المنتج (ابحث بالاسم/الباركود)",
          "حدد الكمية والوحدة",
          "اضغط 'تنفيذ التحويل'",
        ],
        tips: ["الكمية بتتخصم من المصدر وتتضاف للمستقبل"],
      },
      {
        title: "المنتجات التالفة",
        description: "تسجيل منتجات تالفة وإخراجها من المخزون.",
        steps: [
          "اختار المخزن",
          "اختار المنتج",
          "حدد الكمية",
          "اكتب سبب الإخراج والمسؤول",
          "اضغط 'حفظ'",
        ],
        tips: ["الكمية بتتخصم من المخزون نهائيًا"],
      },
    ],
  },
  {
    id: "invoices",
    title: "فواتير المبيعات",
    icon: ReceiptText,
    color: "from-purple-500 to-purple-700",
    items: [
      {
        title: "إنشاء فاتورة مبيعات",
        description: "فاتورة كاملة مع عميل ومخزن ودفع كاش/آجل.",
        steps: [
          "اضغط 'فاتورة جديدة'",
          "اختار العميل (اختياري)",
          "اختار المخزن",
          "اختار طريقة الدفع (كاش/آجل)",
          "ضيف المنتجات: اختار المنتج، الكمية، السعر",
          "اضغط 'حفظ الفاتورة'",
        ],
        tips: [
          "لو دفع كاش: الخزنة بتزيد (لو اخترت خزنة)",
          "لو دفع آجل: المبلغ المتبقي بيتسجل على العميل",
          "المخزون بيتخصم تلقائيًا",
        ],
      },
      {
        title: "عرض/طباعة/تصدير",
        description: "من سجل الفواتير، تقدر تعرض التفاصيل أو تطبع أو تصدّر PDF.",
        steps: [
          "اضغط أيقونة العين 👁 لعرض التفاصيل",
          "اضغط أيقونة التحميل ⬇ لتصدير PDF",
          "أو اطبع من صفحة الطباعة",
        ],
      },
    ],
  },
  {
    id: "purchases",
    title: "المشتريات",
    icon: ShoppingBag,
    color: "from-cyan-500 to-cyan-700",
    items: [
      {
        title: "فاتورة مشتريات",
        description: "تسجيل مشتريات من الموردين.",
        steps: [
          "اختار المورد",
          "اختار المخزن",
          "اختار طريقة الدفع (كاش/آجل)",
          "اختار الحالة (معلق/استلام)",
          "ضيف المنتجات: الكمية، سعر الشراء",
          "اضغط 'حفظ الفاتورة'",
        ],
        tips: [
          "لو 'استلام': المخزون بيزيد، ولو كاش: الخزنة بتقل",
          "لو 'معلق': بتظهر في طلبات الشراء المعلقة",
        ],
      },
      {
        title: "استلام طلب معلق",
        description: "من صفحة 'طلبات الشراء المعلقة'، تقدر تستلم الطلبات.",
        steps: [
          "اضغط 'موافقة واستلام'",
          "المخزون بيزيد تلقائيًا",
        ],
      },
      {
        title: "حذف طلب معلق",
        description: "من صفحة 'طلبات الشراء المعلقة'، اضغط 'رفض'.",
        tips: ["مش ممكن تحذف فاتورة تم استلامها"],
      },
    ],
  },
  {
    id: "suppliers",
    title: "الموردين",
    icon: Truck,
    color: "from-indigo-500 to-indigo-700",
    items: [
      {
        title: "إضافة مورد",
        description: "من صفحة الموردين، اضغط 'إضافة مورد'.",
        steps: ["اكتب اسم المورد والتليفون والإيميل", "اضغط 'حفظ'"],
      },
      {
        title: "حسابات الموردين (الآجل)",
        description: "عرض الفواتير الآجلة والمبالغ المتبقية.",
        steps: [
          "من صفحة 'حسابات الموردين'",
          "شوف الفواتير اللي لسه فيها متبقي",
          "اضغط 'سداد' عشان تسدد كامل أو جزء",
        ],
        tips: [
          "السداد ممكن يكون كاش أو فيزا أو تحويل بنكي",
          "لو اخترت خزنة، رصيدها بيقل",
          "المبلغ المتبقي بيتحدث تلقائيًا",
        ],
      },
      {
        title: "تقرير المدفوعات",
        description: "سجل كل المدفوعات للموردين.",
        steps: [
          "من صفحة 'تقرير مدفوعات الموردين'",
          "فلتر بالمورد والتاريخ",
          "تصدير CSV",
        ],
      },
    ],
  },
  {
    id: "customers",
    title: "العملاء",
    icon: Users,
    color: "from-pink-500 to-pink-700",
    items: [
      {
        title: "إضافة عميل",
        description: "من صفحة العملاء، اضغط 'إضافة عميل جديد'.",
        steps: ["اكتب اسم العميل والتليفون", "اضغط 'حفظ'"],
      },
      {
        title: "حسابات العملاء (الآجل)",
        description: "عرض الفواتير الآجلة والمبالغ المتبقية على العملاء.",
        steps: [
          "من صفحة 'حسابات العملاء'",
          "شوف الفواتير اللي لسه فيها متبقي",
          "اضغط 'سداد' عشان تسجل دفعة",
        ],
        tips: [
          "لو اخترت خزنة، رصيدها بيزيد",
          "المبلغ المتبقي بيتحدث تلقائيًا",
        ],
      },
      {
        title: "تقرير المدفوعات",
        description: "سجل كل المدفوعات من العملاء.",
        steps: ["من صفحة 'تقرير مدفوعات العملاء'", "فلتر بالعميل والتاريخ"],
      },
    ],
  },
  {
    id: "returns",
    title: "المرتجعات",
    icon: RotateCcw,
    color: "from-orange-500 to-red-600",
    items: [
      {
        title: "مرتجع مبيعات",
        description: "إرجاع منتجات من فاتورة مبيعات.",
        steps: [
          "اختار 'مرتجع مبيعات'",
          "اكتب رقم الفاتورة الأصلية",
          "اضغط 'بحث'",
          "حدد الكميات المرتجعة",
          "اكتب سبب الإرجاع",
          "اضغط 'تأكيد الإرجاع'",
        ],
        tips: [
          "المخزون بيزيد تلقائيًا",
          "ممكن ترجع كامل الفاتورة أو جزء منها",
          "مش ممكن ترجع كمية أكتر من اللي في الفاتورة",
        ],
      },
      {
        title: "مرتجع مشتريات",
        description: "إرجاع منتجات لمورد من فاتورة مشتريات.",
        steps: [
          "اختار 'مرتجع مشتريات'",
          "اكتب رقم فاتورة المشتريات",
          "حدد الكميات",
          "اضغط 'تأكيد الإرجاع'",
        ],
        tips: ["المخزون بيقل تلقائيًا", "لازم الفاتورة تكون 'تم استلامها'"],
      },
    ],
  },
  {
    id: "treasury",
    title: "الخزنة والبنك",
    icon: Wallet,
    color: "from-teal-500 to-teal-700",
    items: [
      {
        title: "إضافة خزنة/بنك",
        description: "من صفحة الخزنة والبنك، ضيف خزائن أو حسابات بنكية.",
        steps: [
          "اضغط 'إضافة خزنة' أو 'إضافة حساب بنكي'",
          "اكتب الاسم (واسم البنك ورقم الحساب لو بنك)",
          "حدد الرصيد الافتتاحي",
          "اضغط 'حفظ'",
        ],
      },
      {
        title: "إيداع",
        description: "إضافة رصيد لخزنة أو بنك.",
        steps: [
          "اختار 'إيداع'",
          "اختار خزنة أو بنك",
          "اكتب المبلغ والسبب والمسؤول",
          "اضغط 'إيداع'",
        ],
      },
      {
        title: "سحب",
        description: "خصم رصيد من خزنة أو بنك.",
        steps: [
          "اختار 'سحب'",
          "اختار خزنة أو بنك",
          "اكتب المبلغ",
          "اضغط 'سحب'",
        ],
        tips: ["لو الرصيد مش كافي، رسالة خطأ"],
      },
      {
        title: "تحويل",
        description: "تحويل بين خزنة وبنك أو العكس.",
        steps: [
          "اختار 'تحويل'",
          "اختار المصدر (خزنة/بنك)",
          "اختار المستقبل (خزنة/بنك)",
          "اكتب المبلغ",
          "اضغط 'تحويل'",
        ],
      },
      {
        title: "تقرير الحركات",
        description: "كل الحركات المالية (إيداعات/سحوبات/تحويلات).",
        steps: [
          "من صفحة 'تقارير الخزنة'",
          "فلتر بنوع الحركة والمصدر والتاريخ",
          "تصدير CSV",
        ],
      },
    ],
  },
  {
    id: "vouchers",
    title: "السندات",
    icon: FileText,
    color: "from-amber-500 to-amber-700",
    items: [
      {
        title: "سند قبض",
        description: "تسجيل مبلغ تم قبضه من شخص/جهة.",
        steps: [
          "اختار خزنة أو بنك",
          "اكتب المبلغ",
          "اكتب اسم الجهة (اللي اتدفع منه)",
          "اضغط 'قبض'",
        ],
        tips: ["الرصيد بيزيد تلقائيًا"],
      },
      {
        title: "سند صرف",
        description: "تسجيل مبلغ تم صرفه لشخص/جهة.",
        steps: [
          "اختار خزنة أو بنك",
          "اكتب المبلغ",
          "اكتب اسم الجهة",
          "اضغط 'صرف'",
        ],
        tips: ["الرصيد بيقل تلقائيًا", "لو الرصيد مش كافي، رسالة خطأ"],
      },
      {
        title: "تقرير السندات",
        description: "كل السندات مع الإجماليات.",
        steps: ["من صفحة 'تقرير السندات'", "فلتر بالنوع والتاريخ"],
      },
    ],
  },
  {
    id: "expenses",
    title: "المصروفات",
    icon: Banknote,
    color: "from-rose-500 to-rose-700",
    items: [
      {
        title: "إضافة مصروف",
        description: "تسجيل مصروفات (إيجار، كهرباء، إلخ).",
        steps: [
          "اكتب اسم المصروف والمبلغ",
          "اختار خزنة (اختياري)",
          "اضغط 'حفظ'",
        ],
        tips: ["لو اخترت خزنة، الرصيد بيقل"],
      },
    ],
  },
  {
    id: "employees",
    title: "الموظفين",
    icon: UserGroup,
    color: "from-blue-500 to-blue-700",
    items: [
      {
        title: "إضافة موظف",
        description: "من صفحة الموظفين، ضيف موظف جديد.",
        steps: [
          "اكتب الاسم والتليفون والوظيفة والراتب",
          "اضغط 'حفظ'",
        ],
      },
      {
        title: "مسحوبات الموظفين",
        description: "تسجيل منتجات سحبها الموظف.",
        steps: [
          "اختار الموظف والمنتج",
          "حدد الكمية والمخزن",
          "اضغط 'حفظ'",
        ],
        tips: ["المخزون بيقل تلقائيًا"],
      },
      {
        title: "السلفيات",
        description: "تسجيل سلفية لموظف أو شخص عادي.",
        steps: [
          "اختار نوع الشخص (موظف/شخص)",
          "اختار الموظف أو اكتب اسم الشخص",
          "حدد المبلغ وتاريخ الاستحقاق",
          "اضغط 'حفظ'",
        ],
      },
      {
        title: "صرف المرتبات",
        description: "صرف راتب مع خصم السلف والمسحوبات.",
        steps: [
          "اختار الموظف",
          "الراتب بيتعبأ تلقائيًا",
          "حدد خصم السلف وخصم المسحوبات",
          "شوف صافي الراتب",
          "اضغط 'صرف'",
        ],
        tips: ["السلف بتتحدث تلقائيًا (بتتسدد)"],
      },
      {
        title: "تقارير الموظفين",
        description: "3 تقارير: مرتبات، سلفيات، مسحوبات.",
        steps: ["من صفحة 'تقارير الموظفين'", "اختار النوع والفلترة"],
      },
    ],
  },
  {
    id: "hr",
    title: "الموارد البشرية",
    icon: UserCheck,
    color: "from-emerald-500 to-emerald-700",
    items: [
      {
        title: "تسجيل الحضور",
        description: "تسجيل حضور الموظفين اليومي.",
        steps: [
          "ابحث عن الموظف",
          "اضغط 'تسجيل حضور'",
        ],
      },
      {
        title: "تسجيل الانصراف",
        description: "تسجيل انصراف الموظف.",
        steps: ["اضغط 'تسجيل انصراف' جنب الموظف"],
        tips: ["عدد الساعات بيتحسب تلقائيًا"],
      },
    ],
  },
  {
    id: "reports",
    title: "التقارير",
    icon: BarChart3,
    color: "from-slate-600 to-slate-800",
    items: [
      {
        title: "تقرير المبيعات",
        description: "مبيعات آخر 7 أيام مع رسم بياني.",
        steps: ["من صفحة 'التقارير'", "شوف الرسم والإحصائيات"],
      },
      {
        title: "التقارير المتقدمة",
        description: "تحليل شامل: منتجات راكدة، أكثر مبيعاً، مصروفات.",
        steps: ["من صفحة 'التقارير المتقدمة'", "تصدير CSV"],
      },
      {
        title: "التقارير الشاملة",
        description: "16 تقرير في صفحة واحدة (منتجات، عملاء، موردين، إلخ).",
        steps: [
          "اختار التقرير من التبويبات",
          "تصدير CSV أو طباعة",
        ],
      },
      {
        title: "الإقرار الضريبي",
        description: "تقرير ضريبي شامل (مبيعات + مشتريات + مرتجعات).",
        steps: [
          "حدد الفترة",
          "اختار أنواع العمليات",
          "شوف الإجماليات",
          "تصدير أو طباعة",
        ],
      },
    ],
  },
  {
    id: "settings",
    title: "الإعدادات",
    icon: Settings,
    color: "from-neutral-600 to-neutral-800",
    items: [
      {
        title: "بيانات المتجر",
        description: "بيانات المتجر اللي بتظهر في الفواتير.",
        steps: [
          "اسم المتجر، التليفون، العنوان، الرقم الضريبي",
          "اللوجو (رفع صورة من الجهاز)",
          "نص أسفل الفاتورة",
          "اضغط 'حفظ الإعدادات'",
        ],
      },
      {
        title: "إعدادات الكاشير",
        description: "إعدادات افتراضية للكاشير.",
        steps: [
          "نسبة الضريبة الافتراضية",
          "الخصم الافتراضي",
          "طباعة الفاتورة تلقائيًا",
          "تفعيل البحث بالباركود",
        ],
      },
      {
        title: "إعدادات الطابعات",
        description: "اختيار الطابعة الافتراضية.",
        steps: [
          "اختار الطابعة",
          "احفظ الإعدادات",
          "اختبر الطباعة",
        ],
      },
      {
        title: "الأقسام والوحدات",
        description: "إدارة أقسام المنتجات ووحدات القياس.",
        steps: ["أضف/احذف الأقسام والوحدات"],
      },
    ],
  },
  {
    id: "users",
    title: "المستخدمين والصلاحيات",
    icon: Shield,
    color: "from-red-500 to-red-700",
    items: [
      {
        title: "إضافة مستخدم",
        description: "إضافة مستخدم جديد بصلاحيات محددة.",
        steps: [
          "اكتب الاسم والإيميل وكلمة المرور",
          "اختار الدور (مدير/كاشير/محاسب)",
          "اختار الفرع (اختياري)",
          "حدد الصلاحيات (كل صفحة)",
          "اضغط 'حفظ'",
        ],
        tips: [
          "الأدمن عنده كل الصلاحيات تلقائيًا",
          "المستخدم العادي بيشوف بس الصفحات اللي عنده صلاحية عليها",
          "لو حاول يدخل صفحة مش من صلاحياته، هيتحول لـ 'غير مصرح'",
        ],
      },
      {
        title: "تعديل صلاحيات",
        description: "تعديل صلاحيات مستخدم موجود.",
        steps: [
          "من صفحة المستخدمين، اضغط 'تعديل'",
          "عدّل الصلاحيات",
          "اضغط 'حفظ'",
        ],
      },
    ],
  },
  {
    id: "backup",
    title: "النسخ الاحتياطي",
    icon: Database,
    color: "from-gray-600 to-gray-800",
    items: [
      {
        title: "نسخ احتياطي يدوي",
        description: "تحميل نسخة من كل البيانات.",
        steps: [
          "اضغط 'تحميل النسخة الاحتياطية'",
          "هيتحمّل ملف JSON",
          "احفظ الملف في مكان آمن",
        ],
      },
      {
        title: "نسخ احتياطي على الخادم",
        description: "حفظ نسخة في فولدر backups.",
        steps: ["اضغط 'حفظ نسخة على الخادم'"],
        tips: ["بيحتفظ بآخر 10 نسخ، والقديم بيتحذف تلقائي"],
      },
      {
        title: "نسخ احتياطي تلقائي",
        description: "نسخ تلقائي يومي/أسبوعي.",
        steps: [
          "فعّل 'النسخ التلقائي'",
          "اختار التكرار (يومي/أسبوعي)",
          "احفظ الإعدادات",
        ],
        tips: ["النسخ بيشتغل لما البرنامج يكون مفتوح"],
      },
      {
        title: "استعادة",
        description: "استعادة البيانات من نسخة احتياطية.",
        steps: [
          "اختار ملف JSON",
          "اضغط 'استعادة البيانات'",
          "تأكد إنك متأكد (البيانات الحالية هتتمسح)",
        ],
      },
      {
        title: "Reset",
        description: "مسح كل البيانات (ماعدا المستخدمين).",
        steps: [
          "اضغط 'مسح كل البيانات'",
          "تأكد مرتين",
        ],
        tips: ["⚠️ العملية دي مش ممكن التراجع عنها"],
      },
    ],
  },
  {
    id: "audit-log",
    title: "سجل النشاط",
    icon: ClipboardList,
    color: "from-violet-500 to-violet-700",
    items: [
      {
        title: "عرض السجل",
        description: "كل العمليات اللي حصلت في البرنامج.",
        steps: [
          "من صفحة 'سجل النشاط'",
          "فلتر بنوع الإجراء أو الكيان أو التاريخ",
          "تصدير CSV",
        ],
        tips: [
          "العمليات المسجلة: إضافة، تعديل، حذف، دخول، خروج",
          "بيظهر من عمل العملية وامتى",
        ],
      },
    ],
  },
  {
    id: "tips",
    title: "نصائح وحيل",
    icon: HelpCircle,
    color: "from-yellow-500 to-orange-600",
    items: [
      {
        title: "اختصارات لوحة المفاتيح",
        description: "اختصارات سريعة توفّر وقت.",
        tips: [
          "Ctrl+K: البحث السريع",
          "Esc: إغلاق البحث أو المودال",
          "Enter: تأكيد في البحث",
          "↑↓: التنقل في نتائج البحث",
        ],
      },
      {
        title: "الخزنة والعمليات المالية",
        description: "كل عملية مالية بتأثر على الخزنة.",
        tips: [
          "فاتورة مبيعات كاش + خزنة → الخزنة تزيد",
          "فاتورة مشتريات كاش + خزنة → الخزنة تقل",
          "سداد مورد + خزنة → الخزنة تقل",
          "سداد عميل + خزنة → الخزنة تزيد",
          "مصروف + خزنة → الخزنة تقل",
          "سند قبض → الخزنة تزيد",
          "سند صرف → الخزنة تقل",
        ],
      },
      {
        title: "النسخ الاحتياطي المنتظم",
        description: "خد نسخة احتياطية كل فترة.",
        tips: [
          "فعّل النسخ التلقائي",
          "أو خد نسخة يدوية كل يوم",
          "احفظ النسخ في مكان آمن (فلاشة/سحابة)",
        ],
      },
      {
        title: "صلاحيات المستخدمين",
        description: "كل مستخدم يشوف اللي محتاجه بس.",
        tips: [
          "الكاشير: صلاحية /pos بس",
          "المحاسب: /reports, /expenses, /suppliers, /customers",
          "المدير: كل حاجة",
        ],
      },
    ],
  },
];

export default function HelpPage() {
  const [openSection, setOpenSection] = useState<string | null>("getting-started");
  const [openItem, setOpenItem] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filteredSections = sections.map((section) => ({
    ...section,
    items: section.items.filter((item) => {
      const term = search.trim().toLowerCase();
      if (!term) return true;
      return (
        item.title.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term) ||
        item.steps?.some((s) => s.toLowerCase().includes(term)) ||
        item.tips?.some((t) => t.toLowerCase().includes(term))
      );
    }),
  })).filter((section) => section.items.length > 0 || section.title.toLowerCase().includes(search.toLowerCase()));

  const toggleItem = (sectionId: string, itemTitle: string) => {
    const key = `${sectionId}-${itemTitle}`;
    setOpenItem(openItem === key ? null : key);
  };

  return (
    <>
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8 animate-slide-down">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-lg shadow-primary-300 mb-4">
            <BookOpen className="text-white" size={40} />
          </div>
          <h1 className="text-4xl font-extrabold text-[var(--color-fg)] mb-2">
            دليل استخدام Salesaty
          </h1>
          <p className="text-[var(--color-neutral-500)] max-w-2xl mx-auto">
            كل حاجة محتاج تعرفها عن البرنامج — من البداية للاحتراف
          </p>
        </div>

        {/* Search */}
        <div className="bg-[var(--color-card-bg)] p-4 rounded-2xl shadow-sm border border-[var(--color-card-border)] mb-6 animate-slide-up">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-neutral-400)]" size={20} />
            <input
              type="text"
              placeholder="ابحث في الدليل..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border-2 border-[var(--color-card-border)] bg-[var(--color-card-bg)] text-[var(--color-fg)] p-3 pr-10 rounded-xl focus:border-primary-400 focus:outline-none"
            />
          </div>
          <p className="text-xs text-[var(--color-neutral-500)] mt-2 text-center">
            {sections.reduce((sum, s) => sum + s.items.length, 0)} موضوع في {sections.length} قسم
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-3">
          {filteredSections.map((section) => {
            const Icon = section.icon;
            const isOpen = openSection === section.id;

            return (
              <div
                key={section.id}
                className="bg-[var(--color-card-bg)] rounded-2xl shadow-sm border border-[var(--color-card-border)] overflow-hidden animate-slide-up"
              >
                {/* Section Header */}
                <button
                  onClick={() => setOpenSection(isOpen ? null : section.id)}
                  className={`w-full flex items-center gap-3 p-4 text-right transition-colors ${
                    isOpen ? "bg-[var(--color-neutral-50)]" : "hover:bg-[var(--color-neutral-50)]"
                  }`}
                >
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${section.color} text-white flex-shrink-0`}>
                    <Icon size={22} />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-extrabold text-[var(--color-fg)]">
                      {section.title}
                    </h2>
                    <p className="text-xs text-[var(--color-neutral-500)]">
                      {section.items.length} موضوع
                    </p>
                  </div>
                  {isOpen ? (
                    <ChevronDown className="text-[var(--color-neutral-400)] rotate-180 transition-transform" size={20} />
                  ) : (
                    <ChevronLeft className="text-[var(--color-neutral-400)] transition-transform" size={20} />
                  )}
                </button>

                {/* Items */}
                {isOpen && (
                  <div className="border-t border-[var(--color-card-border)] divide-y divide-[var(--color-card-border)]">
                    {section.items.map((item) => {
                      const itemKey = `${section.id}-${item.title}`;
                      const isItemOpen = openItem === itemKey;

                      return (
                        <div key={item.title} className="p-4">
                          <button
                            onClick={() => toggleItem(section.id, item.title)}
                            className="w-full flex items-center justify-between text-right"
                          >
                            <h3 className="font-bold text-[var(--color-fg)]">{item.title}</h3>
                            <ChevronDown
                              className={`text-[var(--color-neutral-400)] transition-transform ${
                                isItemOpen ? "rotate-180" : ""
                              }`}
                              size={16}
                            />
                          </button>

                          {isItemOpen && (
                            <div className="mt-3 space-y-3 animate-fade-in">
                              <p className="text-sm text-[var(--color-neutral-600)]">
                                {item.description}
                              </p>

                              {item.steps && item.steps.length > 0 && (
                                <div>
                                  <h4 className="text-xs font-bold text-[var(--color-neutral-500)] uppercase mb-2">
                                    الخطوات
                                  </h4>
                                  <ol className="space-y-1.5">
                                    {item.steps.map((step, idx) => (
                                      <li key={idx} className="flex items-start gap-2 text-sm">
                                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex-shrink-0 mt-0.5">
                                          {idx + 1}
                                        </span>
                                        <span className="text-[var(--color-neutral-700)]">{step}</span>
                                      </li>
                                    ))}
                                  </ol>
                                </div>
                              )}

                              {item.tips && item.tips.length > 0 && (
                                <div className="bg-info-500/10 p-3 rounded-xl">
                                  <h4 className="text-xs font-bold text-info-500 mb-2 flex items-center gap-1.5">
                                    💡 ملاحظات
                                  </h4>
                                  <ul className="space-y-1">
                                    {item.tips.map((tip, idx) => (
                                      <li key={idx} className="text-sm text-[var(--color-neutral-700)] flex items-start gap-2">
                                        <span className="text-info-500 mt-0.5">•</span>
                                        <span>{tip}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}