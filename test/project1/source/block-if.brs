sub test1()
    if true then
        print "ok"
    else if false then
        print "ko"
    end if
end sub

sub test2()
    if true
        print "ok"
    else if false
        print "ko"
    end if
end sub

sub control()
    if true print "ok"
    if true then print "ok"
end sub
